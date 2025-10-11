const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');

// ดึงข้อมูลกิจกรรมทั้งหมด (GET)
router.get('/', async (req, res) => {
  try {
    const reminders = await Reminder.find();
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// เพิ่มกิจกรรมใหม่ (POST)
router.post('/', async (req, res) => {
  const reminder = new Reminder({ 
    title: req.body.title,
    date: req.body.date,
    time: req.body.time,
    petId: req.body.petId, // <--- แก้ไขจาก petName เป็น petId
    details: req.body.details,
    userId: req.body.userId,
    completed: false, //<--- ให้มันเก็บค่า เพื่อให้ปุ่มทำงานนะงับ
  });

  try {
    const newReminder = await reminder.save();
    res.status(201).json(newReminder);
  } catch (err) {
    res.status(400).json({ message: err.message }); // 400 Bad Request
  }
});
// ดึงข้อมูล reminders ของผู้ใช้ตาม userId
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    // ดึงข้อมูล reminders ของผู้ใช้ตาม userId และ populate ข้อมูลของสัตว์เลี้ยงจาก petId
    const reminders = await Reminder.find({ userId: userId }).populate("petId", "name type");
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
//ลบการแจ้งเตือนตามid
router.delete("/:reminderId", async (req,res) =>{
  try{
    const {reminderId} = req.params;
    const result = await Reminder.findByIdAndDelete(reminderId);
    if (!result){
      return res.status(404).json({ message : "Reminder not found"});
    }
    res.json({message:"Reminder delete"});
  } catch (err){
      res.status(500).json({message: err.message});
  }

});
// ทำเครื่องหมายกิจกรรมว่าเสร็จแล้ว (POST) < เพื่อให้ปุุ่มส่งและทำงานได้

router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // อัปเดต completed เป็น true
    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, userId },
      { completed: true },
      { new: true }
    );

    if (!reminder) return res.status(404).json({ error: "ไม่พบการแจ้งเตือนนี้" });

    res.json({ message: "ทำเครื่องหมายเสร็จแล้ว", reminder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

module.exports = router;