const express = require("express");
const multer = require("multer");
const CommunityPost = require("../models/communityPost");
const Pet = require("../models/pet");
const User = require("../models/User");
const { cloudinary, storage } = require("../config/cloudinary");

const upload = multer({
  storage,
  limits: { files: 4 },
});

const router = express.Router();

/* ================= CREATE ================= */
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

    // ✅ Cloudinary URL มาอัตโนมัติ
    const imageUrls = (req.files || []).map(f => f.path);

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
    res.status(500).json({ error: err.message });
  }
});

router.post("/updatePost/:id", upload.array("images", 4), async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (req.body.PostDesc !== undefined) {
      post.PostDesc = req.body.PostDesc;
    }

    if (req.body.pets) {
      const petIds = Array.isArray(req.body.pets)
        ? req.body.pets
        : [req.body.pets];
      post.pets = petIds;
    }

    // รูปเดิมที่ยังอยู่
    let updatedImages = [];
    if (req.body.existingImages) {
      updatedImages = Array.isArray(req.body.existingImages)
        ? req.body.existingImages
        : [req.body.existingImages];
    }

    // รูปใหม่จาก cloudinary
    const newImages = (req.files || []).map(f => f.path);
    updatedImages = [...updatedImages, ...newImages];

    // ลบรูปที่ถูกเอาออก
    const removedImages = post.images.filter(
      img => !updatedImages.includes(img)
    );

    for (const img of removedImages) {
      const publicId = img.split("/").slice(-2).join("/").split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }

    post.images = updatedImages;
    await post.save();

    res.json(post);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    for (const img of post.images) {
      const publicId = img.split("/").slice(-2).join("/").split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await post.deleteOne();
    res.json({ message: "Post deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
