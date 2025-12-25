const express = require("express");
const multer = require("multer");
const CommunityPost = require("../models/communityPost");
const Pet = require("../models/pet");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

/* =========================
   MULTER (memory storage)
========================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 4 },
});

/* =========================
   CREATE POST
========================= */
router.post("/", upload.array("images", 4), async (req, res) => {
  try {
    const { PostDesc, pets, owner } = req.body;

    const user = await User.findOne({ userId: owner });
    if (!user) return res.status(400).json({ error: "User not found" });

    let validPets = [];
    if (pets) {
      const petIds = Array.isArray(pets) ? pets : [pets];
      validPets = await Pet.find({ _id: { $in: petIds }, owner: user._id });
    }

    // 🔥 Upload images to Cloudinary
    const imageUrls = [];
    for (const file of req.files || []) {
      const result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
        { folder: "community_posts" }
      );
      imageUrls.push(result.secure_url);
    }

    const post = await CommunityPost.create({
      PostDesc,
      images: imageUrls,
      pets: validPets.map(p => p._id),
      owner: user._id,
    });

    const populatedPost = await CommunityPost.findById(post._id)
      .populate("pets")
      .populate({ path: "owner", select: "username userId" });

    res.status(201).json({
      ...populatedPost.toObject(),
      ownerUsername: populatedPost.owner.username,
    });

  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GET ALL POSTS
========================= */
router.get("/", async (req, res) => {
  try {
    const posts = await CommunityPost.find()
      .populate("pets")
      .populate({ path: "owner", select: "username userId" })
      .sort({ createdAt: -1 });

    const formatted = posts.map(p => ({
      ...p.toObject(),
      ownerUsername: p.owner?.username || "Unknown",
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "ดึงโพสต์ไม่สำเร็จ" });
  }
});

/* =========================
   GET POSTS BY USER
========================= */
router.get("/user/:userId", async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const posts = await CommunityPost.find({ owner: user._id })
      .populate("pets", "name")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   GET SINGLE POST (EDIT)
========================= */
router.get("/communityposts/:id", async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
      .populate("pets")
      .populate("owner", "username email");

    if (!post) return res.status(404).json({ error: "Post not found" });

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

/* =========================
   UPDATE POST
========================= */
router.post("/updatePost/:id", upload.array("images", 4), async (req, res) => {
  try {
    const { PostDesc, pets, existingImages } = req.body;

    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (PostDesc !== undefined) post.PostDesc = PostDesc;

    if (pets) {
      const petIds = Array.isArray(pets) ? pets : [pets];
      const validPets = await Pet.find({ _id: { $in: petIds } });
      post.pets = validPets.map(p => p._id);
    }

    // รูปที่ยังเหลือ
    let updatedImages = [];
    if (existingImages) {
      updatedImages = Array.isArray(existingImages)
        ? existingImages
        : [existingImages];
    }

    // ลบรูปที่ถูกเอาออก
    const removedImages = post.images.filter(img => !updatedImages.includes(img));
    for (const url of removedImages) {
      const publicId = url.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`community_posts/${publicId}`);
    }

    // เพิ่มรูปใหม่
    for (const file of req.files || []) {
      const result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
        { folder: "community_posts" }
      );
      updatedImages.push(result.secure_url);
    }

    post.images = updatedImages;
    await post.save();

    const populated = await CommunityPost.findById(post._id)
      .populate("pets")
      .populate("owner", "username userId");

    res.json(populated);

  } catch (err) {
    console.error("Update post error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   DELETE POST
========================= */
router.delete("/:id", async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    for (const url of post.images) {
      const publicId = url.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`community_posts/${publicId}`);
    }

    await post.deleteOne();
    res.json({ message: "Post deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
