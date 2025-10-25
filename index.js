import express from "express";
import cors from "cors";
import mysql from "mysql2";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// ========================
// 🔧 Express Setup
// ========================
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: ["https://faithbook-9fdd9.web.app", "http://localhost:3000"],
    methods: ["GET", "POST"],
  })
);

// ========================
// ☁️ Cloudinary Config
// ========================
cloudinary.config({
  cloud_name: "dn9a94iwd",
  api_key: "837615743452121",
  api_secret: "02NSy4DiE7AUIenMJrER4-A9Ewc",
});

// ========================
// 📸 Cloudinary Storage (multer-storage-cloudinary)
// ========================
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "faithbook_uploads",
    allowed_formats: ["jpg", "png", "jpeg", "webp", "avif"],
  },
});

const upload = multer({ storage });

// ========================
// 💾 MySQL Connection Pool
// ========================
const db = mysql.createPool({
  host: "bx7tgxpkbkhxpcwuypha-mysql.services.clever-cloud.com",
  user: "ufv0fdxuatzjn12e",
  password: "XYwAZdgqrcK5rmty21Ct",
  database: "bx7tgxpkbkhxpcwuypha",
  port: 3306,
  connectionLimit: 10,
});

db.getConnection((err, connection) => {
  if (err) console.error("❌ MySQL connection failed:", err);
  else {
    console.log("✅ Connected to MySQL via pool!");
    connection.release();
  }
});

// ========================
// 🏠 Routes
// ========================
app.get("/", (req, res) => res.send("Faithbook backend running with Cloudinary 🚀"));

// CREATE post
app.post("/api/posts", upload.single("image"), (req, res) => {
  const { name, avatar, time, privacy, content } = req.body;
  const image = req.file ? req.file.path : null; // 🟢 Cloudinary auto adds .path = URL

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

// READ posts
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
