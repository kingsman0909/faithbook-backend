import express from "express";
import cors from "cors";
import mysql from "mysql2";
import multer from "multer";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🟢 Serve uploaded images so frontend can access them
app.use("/uploads", express.static("uploads"));

// 🟡 Setup multer for file uploads
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// 🟢 Connect to Clever Cloud MySQL
const db = mysql.createConnection({
  host: "bx7tgxpkbkhxpcwuypha-mysql.services.clever-cloud.com",
  user: "ufv0fdxuatzjn12e",
  password: "XYwAZdgqrcK5rmty21Ct",
  database: "bx7tgxpkbkhxpcwuypha",
  port: 3306,
});

db.connect((err) => {
  if (err) console.error("❌ MySQL connection failed:", err);
  else console.log("✅ Connected to MySQL!");
});

// 🏠 Root test route
app.get("/", (req, res) => res.send("Faithbook backend is running 🚀"));

// 🟢 CREATE post (with optional image)
app.post("/api/posts", upload.single("image"), (req, res) => {
  const { name, avatar, time, privacy, content } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  db.query(
    "INSERT INTO posts (name, avatar, time, privacy, content, image) VALUES (?, ?, ?, ?, ?, ?)",
    [name, avatar, time, privacy, content, image],
    (err, result) => {
      if (err) {
        console.error("❌ Insert error:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, id: result.insertId });
    }
  );
});

// 🟣 READ all posts
app.get("/api/posts", (req, res) => {
  db.query("SELECT * FROM posts ORDER BY id DESC", (err, results) => {
    if (err) {
      console.error("❌ Fetch error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// 🟢 Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
