This project is a full-stack web application that allows users to:

-Login with Google OAuth
-Fetch their recent Gmail emails
-Classify them into categories like Important, Promotions, Social, Marketing, Spam, and General (using OpenAI GPT-4o).

---

Technology:

Frontend- React (Vite)
Backend-	Node.js + Express.js
Authentication-	Google OAuth2
APIs-	Gmail API, OpenAI GPT-4o
Styling-	CSS
Environment Management-	dotenv

---

Install:

cd backend
npm install
cd ../frontend
npm install

---

Start the backend server:

cd backend
npm run dev


The backend runs at:
👉 http://localhost:5000

Start the frontend:

cd frontend
npm run dev


The frontend runs at:
👉 http://localhost:5173

---

Classifiers:

Promotions (sale, offer, discount, etc.)
Social (facebook, instagram, etc.)
Marketing (newsletter, campaign, etc.)
Spam (win, prize, unsubscribe, etc.)
Important (invoice, payment, urgent, etc.)

---

Limitations: 

-With my OpenAI API KEY, Classifications are done once then the limit exhaust. The project is ready except need a better API Key.

---
