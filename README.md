SmartVestor

A full-stack personal investment planner built with React and Node.js.
It helps users plan investments based on their goals, budget, risk level, currency, and language — and generates detailed recommendations with asset allocations, fees, risks, and practical tips.

🚀 Tech Stack
Frontend (Client)

React (CRA PWA template) → Single-page app with fast dev server

React Router → Pages: Home, Plan, Recommendations, Auth (Login/Register), Dashboard

Tailwind CSS + PostCSS + Autoprefixer → Responsive, dark premium theme

html2canvas + jsPDF → Export recommendations to PDF

Runs on port 3001, proxied to backend via client/package.json

Backend (Server)

Node.js + Express → REST API (/api/health, /api/recommend, /api/auth, /api/plans)

CORS + body-parser → JSON parsing & cross-origin handling

JWT (jsonwebtoken) + bcryptjs → Secure email/password auth

File-based DB → data/smartvestor.json stores users, sessions, and saved plans

nodemon + concurrently → Auto-restart server; run client & server together

AI Logic

Rule-based generator (no external model)

Builds allocations + guidance (fees, horizon, risks, tips) from inputs:

Goals

Monthly budget

Risk level

Currency

Language (English / Hindi / Hinglish)

✨ Features

📊 Investment Planner → Input goals, budget, risk, currency, and language

💡 Recommendations → Stocks, Mutual Funds, ETFs, Crypto, Real Estate

Includes platforms/markets, fees, horizon, risk notes, and tips

🔐 Authentication → Email/password login & register (demo Google button included)

📂 Plans Dashboard → Save & list investment plans per user

📤 Sharing → Send plans via Email or WhatsApp, export to PDF

📁 Project Structure
root/
│── server.js               # Express entrypoint
│── data/smartvestor.json   # Auto-created DB
│── package.json            # Dev scripts
│
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.js
│   │   ├── pages/
│   │   ├── components/
│   │   └── services/
│   ├── tailwind.config.js
│   └── postcss.config.js

▶️ Running Locally

Clone repo & install dependencies:

npm install
cd client && npm install


Start dev mode (server + client):

npm run dev


Open:

App → http://localhost:3001

API → http://localhost:5000

