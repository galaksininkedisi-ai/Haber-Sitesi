// Simple News Backend (Express + JSON file storage)
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { customAlphabet } from "nanoid";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const ADMIN_USER = process.env.ADMIN_USER || "admin2";
const ADMIN_PASS = process.env.ADMIN_PASS || "5555";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const app = express();
app.use(express.static("public"));
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// static: uploads + public (frontend)
const uploadsDir = path.join(__dirname, "uploads");
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "posts.json");
const publicDir = path.join(__dirname, "public");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, "[]", "utf-8");

app.use("/uploads", express.static(uploadsDir));
app.use(express.static(publicDir)); // index.html vs.

// storage helpers
function readPosts() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
  } catch {
    return [];
  }
}
function writePosts(list) {
  fs.writeFileSync(dataFile, JSON.stringify(list, null, 2), "utf-8");
}

// auth middleware
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Yetkisiz" });
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token geçersiz" });
  }
}

// login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ u: username }, JWT_SECRET, { expiresIn: "12h" });
    return res.json({ token });
  }
  return res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı" });
});

// nanoid for IDs
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

// multer (upload)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const name = `${Date.now()}-${nanoid()}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// list posts (public)
app.get("/api/posts", (req, res) => {
  const list = readPosts().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

// get one (public)
app.get("/api/posts/:id", (req, res) => {
  const post = readPosts().find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Bulunamadı" });
  res.json(post);
});

// create (admin)
app.post(
  "/api/posts",
  auth,
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "media", maxCount: 16 }
  ]),
  (req, res) => {
    const { title, contentHTML } = req.body || {};
    if (!title || !contentHTML) return res.status(400).json({ error: "title ve contentHTML zorunlu" });

    const files = req.files || {};
    const coverFile = files.cover?.[0];
    const mediaFiles = files.media || [];

    const post = {
      id: nanoid(),
      title,
      cover: coverFile ? `${BASE_URL}/uploads/${coverFile.filename}` : null,
      media: mediaFiles.map(f => ({
        type: f.mimetype.startsWith("video") ? "video" : "image",
        src: `${BASE_URL}/uploads/${f.filename}`,
        name: f.originalname
      })),
      contentHTML,
      createdAt: new Date().toISOString(),
      updatedAt: null
    };

    const list = readPosts();
    list.unshift(post);
    writePosts(list);
    res.json(post);
  }
);

// update (admin)
app.put(
  "/api/posts/:id",
  auth,
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "media", maxCount: 16 }
  ]),
  (req, res) => {
    const list = readPosts();
    const idx = list.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Bulunamadı" });

    const { title, contentHTML, keepMedia = "true" } = req.body || {};
    if (title) list[idx].title = title;
    if (contentHTML) list[idx].contentHTML = contentHTML;

    const files = req.files || {};
    const coverFile = files.cover?.[0];
    const mediaFiles = files.media || [];

    if (coverFile) list[idx].cover = `${BASE_URL}/uploads/${coverFile.filename}`;

    if (keepMedia === "false") {
      list[idx].media = [];
    }
    if (mediaFiles.length) {
      const newMedia = mediaFiles.map(f => ({
        type: f.mimetype.startsWith("video") ? "video" : "image",
        src: `${BASE_URL}/uploads/${f.filename}`,
        name: f.originalname
      }));
      list[idx].media = [...(list[idx].media || []), ...newMedia];
    }

    list[idx].updatedAt = new Date().toISOString();
    writePosts(list);
    res.json(list[idx]);
  }
);

// delete (admin)
app.delete("/api/posts/:id", auth, (req, res) => {
  const list = readPosts();
  const idx = list.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Bulunamadı" });
  const [deleted] = list.splice(idx, 1);
  writePosts(list);
  res.json({ ok: true, deletedId: deleted.id });
});

// fallback: SPA pages in /public
app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on ${BASE_URL}`);
});


