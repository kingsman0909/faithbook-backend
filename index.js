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

app.use(
  cors({
    origin: [
      "https://faithbook-9fdd9.web.app",
      "http://localhost:3000"
    ],
    methods: ["GET","POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  })
);

app.options("*", cors());

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

// ========================
// 🏗 Define Models
// ========================
const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    firebaseUid: { type: DataTypes.STRING, allowNull: false, unique: true },
    username: { type: DataTypes.STRING, allowNull: false },
    avatar: { type: DataTypes.STRING, defaultValue: "" },
    bio: { type: DataTypes.TEXT, defaultValue: "" },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  { tableName: "users", timestamps: false }
);

const Post = sequelize.define(
  "Post",
  {
    userId: { type: DataTypes.STRING, allowNull: false }, // Firebase UID
    privacy: { type: DataTypes.STRING, defaultValue: "Public" },
    content: { type: DataTypes.TEXT },
    image: { type: DataTypes.STRING },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  { tableName: "posts", timestamps: false }
);

// 🔗 Relationships
User.hasMany(Post, { foreignKey: "userId" });
Post.belongsTo(User, { foreignKey: "userId" });

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
app.post("/api/posts", upload.single("image"), async (req, res) => {
  console.log("===== POST REQUEST =====");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  console.log("File:", req.file);

  try {
    const { userId, privacy = "Public", content = "" } = req.body;

    if (!userId) return res.status(400).json({ error: "userId is required" });

    const image = req.file ? req.file.path : null;

    const post = await Post.create({
      userId,
      privacy,
      content,
      image
    });

    console.log("Created Post:", post.toJSON());

    res.json({ success: true, post });
  } catch (err) {
    console.error("❌ Error in POST /api/posts:", err);
    res.status(500).json({ error: err.message });
  }
});

// READ Posts
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.findAll({ order: [["id", "DESC"]] });
    res.json(posts);
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE ALL Posts (use carefully!)
app.delete("/api/posts/all", async (req, res) => {
  try {
    await Post.destroy({ where: {}, truncate: true });
    res.json({ message: "All posts deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete posts" });
  }
});

// ========================
// 🚀 Start Server
// ========================
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to MySQL via Sequelize!");

    await sequelize.sync({ force: true }); // ⚠️ drops existing tables
    console.log("✅ Database synced - tables created");

    const PORT = process.env.PORT || 10000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  }
};

startServer();
