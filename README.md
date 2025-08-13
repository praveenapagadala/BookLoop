📚 BookLoop
BookLoop is a book exchange platform that allows users to register, list books, browse available titles, filter by location, and connect with others through a built-in messaging system.
It uses an Express.js + EJS frontend with Node.js backend and Multer for image uploads.

🚀 Features
📖 User Registration & Login (session-based authentication)

📚 Add New Book with cover image upload

🔍 Browse Books listed by other users

📍 Filter Books by Location to find nearby exchange opportunities

💬 Messaging System to contact book owners directly

🖼 Image Upload handled via Multer and stored locally

🗂 View Your Uploaded Books in Dashboard

🛠 Tech Stack
Frontend

EJS templates

HTML5, CSS3, JavaScript

Bootstrap for styling

Backend

Node.js

Express.js

Multer (for file uploads)

Express-session

Database

MongoDB (Mongoose ODM)

📂 Project Structure
csharp
Copy
Edit
BookLoop/
│
├── public/           # Static assets (CSS, JS, uploaded images)
├── views/            # EJS templates for pages
├── models/           # Mongoose schemas
├── routes/           # Express route handlers
├── server.js         # Main backend server
├── package.json      # Project dependencies
└── README.md         # Project documentation
⚙️ Installation & Setup
Clone the repository

bash
Copy
Edit
git clone https://github.com/yourusername/BookLoop.git
cd BookLoop
Install dependencies

bash
Copy
Edit
npm install
Set up environment variables
Create a .env file in the root directory:

env
Copy
Edit
PORT=3000
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_secret
Run the application

bash
Copy
Edit
npm start
App will run at: http://localhost:3000

📸 Screenshots
(Add screenshots of your homepage, location filter, messaging system, and dashboard here)

📌 Future Enhancements
Switch image storage from local uploads to Cloudinary

Add search by book title and author

Implement push notifications for new messages

