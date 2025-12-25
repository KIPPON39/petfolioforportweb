
const express = require("express");
const multer = require("multer");

const CommunityPost = require("../models/communityPost");
const Pet = require("../models/pet");
const User = require("../models/User");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");


const router = express.Router();



const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "community_posts",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({
  storage,
  limits: { files: 4 },
});


// สร้างโพสต์ใหม่
router.post("/", (req, res) => {
  // upload.array("images", 4) จะ limit ไฟล์สูงสุด 4
  upload.array("images", 4)(req, res, async (err) => {
    if (err) {
    if (err.code === "LIMIT_FILE_COUNT") {
      // ไฟล์เกิน 4
      return res.status(400).json({
        error: "คุณสามารถอัปโหลดได้สูงสุด 4 รูปเท่านั้น",
      });
    }
    // กรณีอื่น
    return res.status(500).json({ error: err.message });
  }

    try {
      const { PostDesc, pets, owner } = req.body;

      // หา user ด้วย userId (string)
      const user = await User.findOne({ userId: owner });
      if (!user) return res.status(400).json({ error: "User not found" });

      // ตรวจสอบ pets ของ user
      let validPets = [];
      if (pets) {
        const petIds = Array.isArray(pets) ? pets : [pets];
        validPets = await Pet.find({
          _id: { $in: petIds },
          owner: user._id,
        });
      }

      const files = req.files || [];
     const imagePaths = files.map((file) => file.path);


      const post = new CommunityPost({
        PostDesc,
        images: imagePaths,
        pets: validPets.map((p) => p._id),
        owner: user._id,
      });

      await post.save();

      // populate pets และ owner
      const populatedPost = await CommunityPost.findById(post._id)
        .populate("pets")
        .populate({ path: "owner", select: "username userId" });

      // เพิ่ม ownerUsername ให้ frontend
      const postWithUsername = {
        ...populatedPost.toObject(),
        ownerUsername: populatedPost.owner ? populatedPost.owner.username : "Unknown",
      };

      res.status(201).json(postWithUsername);

    } catch (err) {
      console.error(" Error creating post:", err);
      res.status(500).json({ error: err.message });
    }
  });
});


// ดึงโพสต์ทั้งหมด
router.get("/", async (req, res) => {
  try {
    const posts = await CommunityPost.find()
      .populate("pets")
      .populate({ path: "owner", select: "username userId" });

    const postsWithUser = posts.map((post) => ({
      ...post.toObject(),
      ownerUsername: post.owner ? post.owner.username : "Unknown",
    }));

    res.json(postsWithUser);
  } catch (err) {
    console.error(" Error fetching posts:", err);
    res.status(500).json({ error: "ดึงโพสต์ไม่สำเร็จ" });
  }
});

// GET posts ของ user ตาม userId
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    //  หา user จาก userId
    const user = await User.findOne({ userId: userId }); // สมมติ field ใน User คือ userId
    if (!user) return res.status(404).json({ message: "User not found" });

    //  เอา _id ของ user เป็น ObjectId
    const ownerId = user._id;

    //  หาโพสต์โดย owner แล้วเรียงจากใหม่ → เก่า
    const posts = await CommunityPost.find({ owner: ownerId })
    .populate("pets", "name").sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// GET post ดึงข้อมูลโพสต์ของหน้าแก้ไข
router.get('/communityposts/:id', async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
      .populate('pets')        // ดึงข้อมูลสัตว์เลี้ยง
      .populate('owner', 'username email'); // ดึงข้อมูลเจ้าของโพสต์ เฉพาะ username และ email

    if (!post) return res.status(404).json({ error: 'Post not found' });

    // ส่งข้อมูลทั้งหมดของโพสต์
    res.json({
      _id: post._id,
      PostDesc: post.PostDesc,
      images: post.images,        // array ของ path รูป
      pets: post.pets,            // populated pet objects
      owner: post.owner,          // populated owner object
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      likes: post.likes || [],    // ถ้ามีระบบไลก์
      comments: post.comments || [] // ถ้ามีระบบคอมเมนต์
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});


//  อัปเดตโพสต์
router.post("/updatePost/:id", (req, res) => {
  upload.array("images", 4)(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          error: "คุณสามารถอัปโหลดได้สูงสุด 4 รูปเท่านั้น",
        });
      }
      return res.status(500).json({ error: err.message });
    }

    try {
      const { PostDesc, pets } = req.body;

      // ดึงโพสต์เดิม
      const post = await CommunityPost.findById(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });

      // อัปเดตข้อความ
      if (PostDesc !== undefined) {
        post.PostDesc = PostDesc;
      }

      // อัปเดต pets
      if (pets) {
        const petIds = Array.isArray(pets) ? pets : [pets];
        const validPets = await Pet.find({ _id: { $in: petIds } });
        post.pets = validPets.map(p => p._id);
      }

      // เก็บรูปเดิมที่ผู้ใช้ยังไม่ลบ
      let updatedImages = [];
      if (req.body.existingImages) {
        updatedImages = Array.isArray(req.body.existingImages)
          ? req.body.existingImages
          : [req.body.existingImages];
      }

      // เพิ่มรูปใหม่ที่เพิ่งอัปโหลด
      if (req.files && req.files.length > 0) {
       const newImages = req.files.map(file => file.path);

        updatedImages = [...updatedImages, ...newImages];
      }

      // หารูปที่ถูกลบออก
      const removedImages = post.images.filter(img => !updatedImages.includes(img));

      // ลบไฟล์ออกจากโฟลเดอร์จริง
      for (const imgPath of removedImages) {
        const fullPath = path.join(process.cwd(), imgPath); // เช่น /project/uploads/Post/xxxx.jpg
        if (fs.existsSync(fullPath)) {
          fs.unlink(fullPath, (err) => {
            if (err) console.error(` ลบไฟล์ไม่สำเร็จ: ${fullPath}`, err);
            else console.log(` ลบไฟล์เรียบร้อย: ${fullPath}`);
          });
        }
      }

      // บันทึกข้อมูลใหม่
      post.images = updatedImages;
      await post.save();

      // populate pets และ owner
      const populatedPost = await CommunityPost.findById(post._id)
        .populate("pets")
        .populate({ path: "owner", select: "username userId" });

      res.json({
        _id: populatedPost._id,
        PostDesc: populatedPost.PostDesc,
        images: populatedPost.images,
        pets: populatedPost.pets,
        owner: populatedPost.owner,
        createdAt: populatedPost.createdAt,
        updatedAt: populatedPost.updatedAt,
        likes: populatedPost.likes || [],
        comments: populatedPost.comments || []
      });

    } catch (err) {
      console.error(" Error updating post:", err);
      res.status(500).json({ error: err.message });
    }
  });
});

// DELETE post by id (Cloudinary)
router.delete("/:id", async (req, res) => {
  try {
    const postId = req.params.id;

    // หาโพสต์ก่อน
    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // ลบรูปจาก Cloudinary
    if (Array.isArray(post.images) && post.images.length > 0) {
      for (const imgUrl of post.images) {
        /**
         * ตัวอย่าง imgUrl:
         * https://res.cloudinary.com/xxx/image/upload/v123456/community_posts/abc.jpg
         *
         * public_id = community_posts/abc
         */
        const publicId = imgUrl
          .split("/")
          .slice(-2)        // community_posts/abc.jpg
          .join("/")
          .split(".")[0];  // community_posts/abc

        await cloudinary.uploader.destroy(publicId);
      }
    }

    // ลบโพสต์ออกจาก DB
    await CommunityPost.findByIdAndDelete(postId);

    res.json({ message: "Post and all images deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Server error" });
  }
});




module.exports = router;
