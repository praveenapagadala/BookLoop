📚 **BookLoop**

BookLoop is a book exchange platform that allows users to register, list books, browse available titles, filter by location, and connect with others through a built-in messaging system.
It uses an Express.js + EJS frontend with Node.js backend and Multer for image uploads.

🚀 **Features**

📖 User Registration & Login (session-based authentication)

📚 Add New Book with cover image upload

🔍 Browse Books listed by other users

📍 Filter Books by Location to find nearby exchange opportunities

💬 Messaging System to contact book owners directly

🖼 Image Upload handled via Multer and stored locally

🗂 View Your Uploaded Books in Dashboard

🛠 **Tech Stack**

__Frontend__

EJS templates

HTML5, CSS3, JavaScript

Bootstrap for styling

__Backend__

Node.js

Express.js

Multer (for file uploads)

Express-session

__Database__

Firestore

📂 **Project Structure**

BookLoop/
│
├── public/           # Static assets (CSS, JS, uploaded images)
├── views/            # EJS templates for pages
├── routes/           # Express route handlers
├── server.js         # Main backend server
├── package.json      # Project dependencies
└── README.md         # Project documentation


📌 **Future Enhancements**

Add search by book title and author

Implement push notifications for new messages

