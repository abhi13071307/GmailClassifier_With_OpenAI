// backend/routes/auth.js
import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI // http://localhost:5000/auth/google/callback
);

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "openid",
  "profile",
  "email",
];

router.get("/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
  res.redirect(url);
});

router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send("Missing code");
    const { tokens } = await oauth2Client.getToken(code);
    // tokens.access_token is the Gmail access token (starts with ya29.)
    const accessToken = tokens.access_token;
    console.log("OAuth tokens fetched - access token present:", !!accessToken, "hasRefresh:", !!tokens.refresh_token);
    // For demo: redirect to frontend with access_token
    return res.redirect(`http://localhost:5173/dashboard?access_token=${accessToken}`);
  } catch (err) {
    console.error("OAuth callback error:", err?.response?.data || err.message || err);
    return res.status(500).send("Auth callback failed");
  }
});

export default router;
