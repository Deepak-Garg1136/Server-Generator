
const express = require('express');
const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors({ origin: "*" }));

const authMiddleware = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

const adminMiddleware = (req, res, next) => {
  if (req.headers.authorization !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

const logger = (req, res, next) => {
  console.log(req.method, req.url);
  next();
};

app.post('/login', authMiddleware, (req, res) => {
  res.json({ message: "Login Route response" });
});

app.post('/signup', authMiddleware, (req, res) => {
  res.json({ message: "Signup Route response" });
});

app.post('/signout', authMiddleware, (req, res) => {
  res.json({ message: "Signout Route response" });
});

app.get('/user', authMiddleware, (req, res) => {
  res.json({ message: "User Route response" });
});

app.get('/admin', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ message: "Admin Route response" });
});

app.get('/home', (req, res) => {
  res.json({ message: "Home Page response" });
});

app.get('/about', logger, (req, res) => {
  res.json({ message: "About Page response" });
});

app.get('/news', logger, (req, res) => {
  res.json({ message: "News Page response" });
});

app.get('/blogs', logger, (req, res) => {
  res.json({ message: "Blogs Page response" });
});

app.listen(3000, () => console.log("Server running on port 3000"));
