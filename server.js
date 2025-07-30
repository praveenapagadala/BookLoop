// server.js
const express = require("express");
const path = require("path");
const admin = require("firebase-admin");
const session = require("express-session");
const { getFirestore } = require("firebase-admin/firestore");
const bcrypt = require("bcrypt");
const multer = require("multer");

const app = express();
const upload = multer({ dest: "public/uploads" });
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;

const serviceAccount = require("./key.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = getFirestore();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: "bookloop_secret_key", resave: false, saveUninitialized: true }));
app.use((req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });
app.use(express.static(path.join(__dirname, "public")));

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

function isAuthenticated(req, res, next) {
  if (req.session.userdata) return next();
  res.redirect("/auth");
}

// Routes
app.get("/", (req, res) => res.render("auth"));
app.get("/auth", (req, res) => res.render("auth"));
app.get("/about", isAuthenticated, (req, res) => res.render("about", { title: "About Us" }));
app.get("/index", isAuthenticated, (req, res) => res.render("index"));

app.get("/books", isAuthenticated, async (req, res) => {
  try {
    const booksSnapshot = await db.collection("books").get();
    const requestsSnapshot = await db.collection("requests")
      .where("requesterEmail", "==", req.session.userdata.email)
      .get();

    const requestedBookIds = requestsSnapshot.docs.map(doc => doc.data().bookId);
    const books = booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const selectedLocation = req.query.location || "";

    // ✅ Normalize locations for uniqueness (case-insensitive)
    const locationMap = new Map(); // Map to store unique locations
    books.forEach(book => {
      if (book.location) {
        const loc = book.location.trim().toLowerCase();
        if (!locationMap.has(loc)) {
          locationMap.set(loc, book.location.trim());
        }
      }
    });
    const uniqueLocations = Array.from(locationMap.values());

    // ✅ Case-insensitive filtering
    const filteredBooks = selectedLocation
      ? books.filter(book =>
          (book.location || "").trim().toLowerCase() === selectedLocation.trim().toLowerCase()
        )
      : books;

    res.render("books", {
      books: filteredBooks,
      email: req.session.userdata.email,
      requestedBookIds,
      uniqueLocations,
      selectedLocation
    });
  } catch (error) {
    console.error("Books Page Error:", error);
    res.render("books", {
  books: filteredBooks,
  email: req.session.userdata.email,
  requestedBookIds,
  uniqueLocations,
  selectedLocation
});

  }
});



app.get("/inbox", async (req, res) => {
  const currentUser = req.session.user.email; // or uid if you use that

  const messagesSnapshot = await db.collection("messages")
    .where("participants", "array-contains", currentUser)
    .orderBy("timestamp", "desc")
    .get();

  const inboxMap = new Map();

  messagesSnapshot.forEach(doc => {
    const data = doc.data();
    const otherUser = data.sender === currentUser ? data.receiver : data.sender;

    if (!inboxMap.has(otherUser)) {
      inboxMap.set(otherUser, {
        user: otherUser,
        lastMessage: data.message,
        time: data.timestamp.toDate(),
      });
    }
  });

  const inbox = Array.from(inboxMap.values());

  res.render("dashboard", {
    username: req.session.user.username,
    books: userBooks,
    requests: pendingRequests,
    purchasedBooks: purchasedBooks,
    inbox: inbox, // 👈 pass inbox array
  });
});


// Render chat page
app.get('/chat/:receiver', isAuthenticated, async (req, res) => {
  const currentUser = req.session.userdata.email;
  const receiver = req.params.receiver;
  const bookId = req.query.bookId; // ✅ <-- GET BOOK ID

  try {
    let bookOwner = null;
    if (bookId) {
      const bookDoc = await db.collection("books").doc(bookId).get();
      if (bookDoc.exists) {
        bookOwner = bookDoc.data().owner;
      }
    }

    const messagesRef = db.collection("messages")
      .where("participants", "array-contains", currentUser)
      .orderBy("timestamp");

    const snapshot = await messagesRef.get();

    const messages = snapshot.docs
  .map(doc => doc.data())
  .filter(msg =>
    msg.sender.toLowerCase() === currentUser.toLowerCase() && msg.receiver.toLowerCase() === receiver.toLowerCase() ||
    msg.sender.toLowerCase() === receiver.toLowerCase() && msg.receiver.toLowerCase() === currentUser.toLowerCase()
  );


    res.render("chat", {
      messages,
      currentUser,
      receiver,
      bookOwner // ✅ pass this to your EJS
    });
  } catch (err) {
    console.error("Chat Route Error:", err);
    res.status(500).send("Server error while loading chat");
  }
});



app.get('/browse-books', isAuthenticated, async (req, res) => {
  try {
    const selectedLocation = req.query.location;

    const booksSnapshot = await db.collection("books").get();
    let books = booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get unique locations for filter dropdown
    const uniqueLocations = [...new Set(books.map(book => book.location))];

    // Filter books by selected location
    if (selectedLocation) {
      books = books.filter(book => book.location === selectedLocation);
    }

    res.render('books', {
      books,
      uniqueLocations,
      selectedLocation,
      email: req.session.userdata.email,
      requestedBookIds: [] // You can populate this if needed like in the /books route
    });
  } catch (err) {
    console.error("Browse Books Error:", err);
    res.render("books", {
      books: [],
      uniqueLocations: [],
      selectedLocation: "",
      email: "",
      requestedBookIds: []
    });
  }
});



app.post("/send-message", isAuthenticated, async (req, res) => {
  const sender = req.session.userdata.email;
  const { receiver, message } = req.body;

  try {
    await db.collection("messages").add({
      sender,
      receiver,
      message,
      participants: [sender, receiver],
      timestamp: new Date()
    });

    res.redirect("/chat/" + receiver);
  } catch (err) {
    console.error("Send Message Error:", err);
    res.status(500).send("Message sending failed");
  }
});

app.get("/dashboard", isAuthenticated, async (req, res) => {
  const { username, email } = req.session.userdata;

  try {
    const booksSnapshot = await db.collection("books").where("owner", "==", email).get();
    const books = booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const requestsSnapshot = await db.collection("requests")
      .where("ownerEmail", "==", email)
      .where("status", "==", "pending").get();
    const requests = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const purchasedSnapshot = await db.collection("user_books")
      .where("buyerEmail", "==", email).get();
    const purchasedBooks = purchasedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const returnSnapshot = await db.collection("return_requests")
      .where("requesterEmail", "==", email).get();
    const returnRequests = returnSnapshot.docs.map(doc => doc.data().bookId);

    const returnToApproveSnapshot = await db.collection("return_requests")
      .where("ownerEmail", "==", email)
      .where("status", "==", "pending").get();
    const returnRequestsToApprove = returnToApproveSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const messagesSnapshot = await db.collection("messages")
      .where("participants", "array-contains", email)
      .orderBy("timestamp", "desc")
      .get();

    const inboxMap = new Map();
    messagesSnapshot.forEach(doc => {
      const data = doc.data();
      const otherUser = data.sender === email ? data.receiver : data.sender;
      if (!inboxMap.has(otherUser)) {
        inboxMap.set(otherUser, {
          user: otherUser,
          lastMessage: data.message,
          time: data.timestamp.toDate(),
        });
      }
    });

    const inbox = Array.from(inboxMap.values());

    res.render("dashboard", {
      username,
      email,
      books,
      requests,
      purchasedBooks,
      returnRequests,
      returnRequestsToApprove,
      inbox
    });

  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).send("Dashboard server error");
  }
});

app.get('/get-messages', isAuthenticated, async (req, res) => {
  const { currentUser, receiver } = req.query;

  try {
    const messagesRef = db.collection("messages")
      .where("participants", "array-contains", currentUser)
      .orderBy("timestamp");

    const snapshot = await messagesRef.get();

    const messages = snapshot.docs
      .map(doc => doc.data())
      .filter(msg =>
        (msg.sender.toLowerCase() === currentUser.toLowerCase() &&
         msg.receiver.toLowerCase() === receiver.toLowerCase()) ||
        (msg.sender.toLowerCase() === receiver.toLowerCase() &&
         msg.receiver.toLowerCase() === currentUser.toLowerCase())
      );

    res.json(messages);
  } catch (err) {
    console.error("get-messages error:", err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});




app.get("/book_details/:id", isAuthenticated, async (req, res) => {
  const bookId = req.params.id;
  try {
    const bookDoc = await db.collection("books").doc(bookId).get();
    if (!bookDoc.exists) return res.status(404).send("❌ Book not found");
    res.render("book_details", { book: bookDoc.data() });
  } catch (error) {
    res.status(500).send("❌ Server error");
  }
});

app.post("/auth", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) {
    return res.render("auth", { error: "❌ Invalid input.", email });
  }
  try {
    const existing = await db.collection("users").where("email", "==", email).get();
    if (!existing.empty) {
      return res.render("auth", { error: "❌ Email Already Exists.", email });
    }
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    await db.collection("users").add({ name, email, password: hashedPassword });
    req.session.userdata = { username: name, email };
    res.redirect("/dashboard");
  } catch (error) {
    res.render("auth", { error: "❌ Server error.", email });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const snapshot = await db.collection("users").where("email", "==", email).get();
    if (snapshot.empty) return res.render("auth", { error: "❌ Email not found.", email });
    const user = snapshot.docs[0].data();
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.render("auth", { error: "❌ Incorrect password.", email });
    req.session.userdata = { username: user.name, email };
    res.redirect("/dashboard");
  } catch (error) {
    res.render("auth", { error: "❌ Login failed. Try again.", email });
  }
});

app.post("/logout", (req, res) => req.session.destroy(() => res.redirect("/auth")));

app.post("/list-book", upload.single("image"), async (req, res) => {
  const { title, author, condition, location } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;
  const user = req.session.userdata;
  if (!user) return res.redirect("/auth");
  try {
    await db.collection("books").add({
      title, author, condition, location, image,
      owner: user.email,
      ownerName: user.username,
      timestamp: new Date()
    });
    res.redirect("/dashboard");
  } catch (err) {
    console.error("List Book Error:", err);
    res.redirect("/dashboard");
  }
});



const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

io.on("connection", (socket) => {
  console.log("✅ A user connected");

  socket.on("sendMessage", async (data) => {
    try {
      const newMessage = {
        sender: data.sender,
        receiver: data.receiver,
        message: data.message,
        participants: [data.sender, data.receiver],
        timestamp: new Date()
      };

      await db.collection("messages").add(newMessage);

      io.emit("newMessage", newMessage); // Send to all clients
    } catch (err) {
      console.error("Message save error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔌 A user disconnected");
  });
});

http.listen(PORT, () => console.log(`BookLoop server running on http://localhost:${PORT}`));

