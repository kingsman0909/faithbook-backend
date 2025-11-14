import express from "express";
import cors from "cors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { Sequelize, DataTypes } from "sequelize";
import dotenv from "dotenv";


dotenv.config();

// ========================
// 🔧 Express Setup
// ========================
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(cors({
  origin: [
    "https://faithbook-9fdd9.web.app",
    "http://localhost:3000"
  ],
  methods: ["GET","POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.options('*', cors());



// ========================
// 💾 Sequelize Setup
// ========================

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    port: process.env.DB_PORT,
    logging: false
  }
);

try {
  await sequelize.authenticate();
  console.log("✅ Connected to MySQL via Sequelize!");
} catch (err) {
  console.error("❌ Sequelize connection failed:", err);
}

// ========================
// 🏗 Define Post Model
// ========================
const Post = sequelize.define("Post", {
  name: { type: DataTypes.STRING, allowNull: false },
  avatar: { type: DataTypes.STRING },
  privacy: { type: DataTypes.STRING, defaultValue: "public" },
  content: { type: DataTypes.TEXT },
  image: { type: DataTypes.STRING },
  time: { type: DataTypes.STRING, allowNull: false }  // 👈 store time as string
}, {
  tableName: "posts",
  timestamps: false  // 👈 disable automatic timestamps
});



// Sync table
await sequelize.sync();

// ========================

// ☁️ Cloudinary Setup
// ========================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ========================
// 📸 Multer Cloudinary Storage
// ========================
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "faithbook_uploads",
    allowed_formats: ["jpg", "jpeg", "png", "webp"]
  }
});
const upload = multer({ storage });

// ========================

// 🏠 Routes
// ========================
app.get("/", (req, res) => res.send("Faithbook backend running with Cloudinary 🚀"));


// CREATE Post
// CREATE Post
app.post("/api/posts", upload.single("image"), async (req, res) => {
  console.log("===== POST REQUEST =====");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  console.log("File:", req.file);

  try {
    const { name, avatar = '', privacy = 'Public', content = '' } = req.body;

    // Required field check
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Safely handle image
    const image = req.file ? (req.file.path || req.file.filename || req.file.url) : null;

    // Always provide time as string
    const time = new Date().toLocaleString();

    // Create post
    const post = await Post.create({
      name,
      avatar,
      privacy,
      content,
      image,
      time
    });

    console.log("Created Post:", post.toJSON());

    res.json({ success: true, id: post.id, image, time });
  } catch (err) {
    console.error("❌ Error in POST /api/posts:", err);
    res.status(500).json({ error: err.message });
  }
});





// READ Posts
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.findAll({ order: [["id","DESC"]] });
    res.json(posts);
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ error: err.message });
  }

});

app.delete('/api/posts/all', async (req, res) => {
  try {
    // 🔒 Add authentication here so only you can call it
    await Post.destroy({ where: {}, truncate: true });
    res.json({ message: 'All posts deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete posts' });
  }
});


// ========================
// 🚀 Start Server
// ========================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
