# tinylink-harsha
🚀 TinyLink Backend
URL Shortener API built with Node.js, Express & Neon PostgreSQL
<img width="1484" height="1048" alt="image" src="https://github.com/user-attachments/assets/9d495216-01c2-4d14-bb2b-2531cb9a8d40" />
<img width="1895" height="1068" alt="image" src="https://github.com/user-attachments/assets/17f7ebb1-1ef0-4de0-a1de-a98d8f21d72f" />
<img width="1531" height="1075" alt="image" src="https://github.com/user-attachments/assets/78aeb8d1-9729-4062-9f40-287618f05a26" />
<img width="1484" height="1078" alt="image" src="https://github.com/user-attachments/assets/3d05bbac-f63e-4004-96ee-3c3e1bb1eb0b" />
<img width="1887" height="1072" alt="image" src="https://github.com/user-attachments/assets/ee74c23e-8330-4182-9cd9-76f440eb0ff7" />
<img width="1908" height="1074" alt="image" src="https://github.com/user-attachments/assets/5c3e34cc-147d-47ea-ba4b-a2e93692e018" />

TinyLink Backend is the server-side API for generating and managing short URLs.
It powers the TinyLink frontend with fast and reliable URL shortening, redirection, and analytics.

📌 Features
🔗 Short URL Generation

Automatically creates short codes using:

[A-Za-z0-9]{6,8}


Fully random

Guaranteed unique via DB constraint

🆓 Custom Short Code

User can provide their own code

API checks and prevents duplicates

📊 Click Analytics

Tracks:
✔ total clicks
✔ last clicked date/time

🧠 Smart Duplicate Handling

If long URL already exists → returns previously created code

Prevents DB duplication

🔁 Fast Redirection

Redirects /code → long URL

Updates click counter instantly

🏗️ Tech Stack

Node.js

Express.js

Neon PostgreSQL

Render (deployment)

📁 API Endpoints
1️⃣ Create Short URL

POST /api/links

Body:

{
  "targetUrl": "https://example.com",
  "code": "optionalCustomCode"
}

2️⃣ Get All Links

GET /api/links

3️⃣ Get One Link

GET /api/links/:code

4️⃣ Delete Link

DELETE /api/links/:code

5️⃣ Redirect to Original URL

GET /:code
Automatically redirects and updates analytics.

🔐 Environment Variables

Create .env file:

DATABASE_URL=your-neon-database-url
PORT=5000

🚀 Run Locally
npm install
npm start


Backend will start on:

http://localhost:5000

🌍 Deployed Backend URL

Your Render backend URL goes here:

https://tinylink-backend-9vfc.onrender.com

📚 Project Overview

This backend provides a complete URL-shortening service with redirect logic, analytics tracking, random code generation, and secure database storage.
