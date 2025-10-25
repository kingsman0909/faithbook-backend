import express from "express";
import cors from "cors";
import mysql from "mysql2";
import multer from "multer";
import path from "path";

// ========================
// 🔧 Express Setup
// ========================
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🟢 Allow frontend to access backend (adjust if you use another domain)
app.use(cors({
  origin: [
    "https://faithbook-9fdd9.web.app", // your Firebase Hosting URL
    "http://localhost:3000"
  ],
  methods: ["GET", "POST"],
}));

// 🟢 Serve uploaded images
app.use("/uploads", express.static("uploads"));

// ========================
// 💾 MySQL Connection Pool (Fixes Closed Connection Issue)
// ========================
const db = mysql.createPool({
  host: "bx7tgxpkbkhxpcwuypha-mysql.services.clever-cloud.com",
  user: "ufv0fdxuatzjn12e",
  password: "XYwAZdgqrcK5rmty21Ct",
  database: "bx7tgxpkbkhxpcwuypha",
  port: 3306,
  connectionLimit: 10,
  connectTimeout: 10000
});

// Test DB connection once
db.getConnection((err, connection) => {
  if (err) console.error("❌ MySQL connection failed:", err);
  else {
    console.log("✅ Connected to MySQL via pool!");
    connection.release();
  }
});

// ========================
// 📸 Multer Setup (For Image Uploads)
// ========================
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ========================
// 🏠 Routes
// ========================

// Root test route
app.get("/", (req, res) => res.send("Faithbook backend is running 🚀"));

// CREATE Post
app.post("/api/posts", upload.single("image"), (req, res) => {
  const { name, avatar, time, privacy, content } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = `
    INSERT INTO posts (name, avatar, time, privacy, content, image)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [name, avatar, time, privacy, content, image], (err, result) => {
    if (err) {
      console.error("❌ Insert error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, id: result.insertId });
  });
});

// READ Posts
app.get("/api/posts", (req, res) => {
  db.query("SELECT * FROM posts ORDER BY id DESC", (err, results) => {
    if (err) {
      console.error("❌ Fetch error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// ========================
// 🚀 Start Server
// ========================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
