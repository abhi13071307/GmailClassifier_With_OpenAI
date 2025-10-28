// backend/routes/emails.js
import express from "express";
import { google } from "googleapis";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

/**
 * Helper: create an OAuth2 client and set the access token (or tokens object)
 */
function createOAuthClient(access_token) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  // If you only have an access token:
  oauth2Client.setCredentials({ access_token });

  return oauth2Client;
}

/**
 * GET /emails/fetch?access_token=...&count=15
 * Fetch list of messages' id, then fetch each message detail (snippet and From)
 */
router.get("/fetch", async (req, res) => {
  const { access_token, count = 15 } = req.query;

  if (!access_token) return res.status(400).json({ message: "missing access_token" });

  try {
    const auth = createOAuthClient(access_token);
    const gmail = google.gmail({ version: "v1", auth });

    // list messages
    const listResp = await gmail.users.messages.list({
      userId: "me",
      maxResults: Number(count),
    });

    const messages = listResp.data.messages || [];

    const emails = [];
    // fetch each message detail
    for (const msg of messages) {
      try {
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "full",
        });

        const payload = detail.data.payload || {};
        const headers = payload.headers || [];
        const fromHeader = headers.find((h) => h.name === "From")?.value || "";
        // snippet is available in the message object
        const snippet = detail.data.snippet || "";

        emails.push({
          id: msg.id,
          from: fromHeader,
          snippet,
        });
      } catch (innerErr) {
        // If one message fails, continue with others
        console.warn("Failed to fetch message", msg.id, innerErr?.message || innerErr);
      }
    }

    return res.json({ emails });
  } catch (err) {
    console.error("Fetch emails error:", err?.response?.data || err.message || err);
    return res.status(500).json({ message: "Error fetching emails" });
  }
});

/**
 * POST /emails/classify
 * Request body: { emails: [{id, from, snippet}, ...], openaiKey: "sk-..."}
 * Returns: { classified: [{ id, from, snippet, category }, ...] }
 */
router.post("/classify", async (req, res) => {
  const { emails, openaiKey } = req.body;

  if (!emails || !Array.isArray(emails)) {
    return res.status(400).json({ message: "emails array is required in body" });
  }
  if (!openaiKey) {
    return res.status(400).json({ message: "openaiKey is required in body" });
  }

  try {
    // Build a prompt that instructs the model to return valid JSON
    const instructions = `You will be given a list of emails. For each email return an object with keys:
"id" (string), "from" (string), "snippet" (string), "category" (one of Important, Promotions, Social, Marketing, Spam, General).
Return ONLY a JSON array (no other text). Example:
[
  {"id":"1","from":"Alice <a@x.com>","snippet":"...","category":"Important"},
  ...
]

Classify based on the content and sender.`;

    const emailText = emails
      .map(
        (e) =>
          `{"id": "${e.id}", "from": "${(e.from || "").replace(/"/g, '\\"')}", "snippet": "${(e.snippet || "")
            .replace(/"/g, '\\"')
            .replace(/\n/g, " ")}"}`
      )
      .join(",\n");

    const fullPrompt = `${instructions}\n\nEmails:\n[${emailText}]`;

    // Call OpenAI Chat Completions
    const payload = {
      model: "gpt-4o", // or "gpt-4o-mini" if you prefer; user must have access
      messages: [{ role: "user", content: fullPrompt }],
      temperature: 0,
      max_tokens: 2000,
    };

    const resp = await axios.post("https://api.openai.com/v1/chat/completions", payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
    });

    const assistantText = resp.data?.choices?.[0]?.message?.content;
    if (!assistantText) {
      return res.status(500).json({ message: "OpenAI returned no text" });
    }

    // Try to find JSON in assistantText and parse it
    let parsed = null;
    try {
      // sometimes model may include markdown; extract first JSON array via regex
      const jsonMatch = assistantText.match(/\[.*\]/s);
      const jsonString = jsonMatch ? jsonMatch[0] : assistantText;
      parsed = JSON.parse(jsonString);
    } catch (parseErr) {
      console.error("Failed to parse model output as JSON:", parseErr, "output:", assistantText);
      return res.status(500).json({ message: "Failed to parse OpenAI response as JSON", raw: assistantText });
    }

    // Ensure each item has the fields we expect; fallback to "General" if missing
    const classified = parsed.map((it) => ({
      id: it.id || null,
      from: it.from || "",
      snippet: it.snippet || "",
      category: (it.category || "General").trim(),
    }));

    return res.json({ classified });
  } catch (err) {
    console.error("Classification error:", err?.response?.data || err.message || err);
    return res.status(500).json({ message: "Classification failed" });
  }
});

export default router;
