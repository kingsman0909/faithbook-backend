import express from "express";
import cors from "cors";
import mysql from "mysql2";

const app = express();
app.use(cors());
app.use(express.json());

// Connect to Clever Cloud MySQL
const db = mysql.createConnection({
  host: "bx7tgxpkbkhxpcwuypha-mysql.services.clever-cloud.com",
  user: "ufv0fdxuatzjn12e",
  password: "XYwAZdgqrcK5rmty21Ct",
  database: "bx7tgxpkbkhxpcwuypha",
  port: 3306
});

db.connect(err => {
  if (err) console.error("❌ MySQL connection failed:", err);
  else console.log("✅ Connected to MySQL!");
});

app.get("/", (req, res) => res.send("Faithbook backend is running 🚀"));

// Example route: Create Post
app.post("/createPost", (req, res) => {
  const { name, avatar, time, privacy, content } = req.body;
  db.query(
    "INSERT INTO posts (name, avatar, time, privacy, content) VALUES (?, ?, ?, ?, ?)",
    [name, avatar, time, privacy, content],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: result.insertId });
    }
  );
});

app.listen(10000, () => console.log("🚀 Server running on port 10000"));
