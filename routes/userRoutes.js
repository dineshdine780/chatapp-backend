import express from "express";
import User from "../models/User.js";
import multer from 'multer';
import { encryptText, decryptText } from "../utils/encryption.js"; 
import authMiddleware from "../middleware/authMiddleware.js";
import fs from "fs";
import path from "path";   

const router = express.Router(); 


// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, "uploads/"),
//   filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
// });
// const upload = multer({ storage });



const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });





// router.put("/:id", upload.single("image"), async (req, res) => {
//   try {
//     let { username, bio } = req.body;
//     const image = req.file ? `/uploads/${req.file.filename}` : undefined;

   
//     if (username) username = encryptText(username);

//     const updatedUser = await User.findByIdAndUpdate(
//       req.params.id,
//       { username, bio, ...(image && { image }) },
//       { new: true }
//     );

//     res.json(updatedUser);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });  




router.put("/:id", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    let { username, bio } = req.body;

    const updateData = {};

   
    if (username) updateData.username = encryptText(username);
    if (bio) updateData.bio = encryptText(bio);

   
    if (req.file) updateData.image = `/uploads/${req.file.filename}`;

   
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

   
    res.json({
      ...updatedUser.toObject(),
      username: updatedUser.username ? decryptText(updatedUser.username) : "",
      bio: updatedUser.bio ? decryptText(updatedUser.bio) : "",
    });
  } catch (err) {
    console.error("Update user error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


router.get("/", async (req, res) => {
  try {
    
    const users = await User.find({ isDeleted: { $ne: true } })
      .select("username email image"); 

    const decrypted = users.map(u => ({
      ...u.toObject(),
      username: decryptText(u.username),
    }));

    res.json(decrypted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



router.get("/chats/:userId", async (req, res) => {
  try {
    const chats = await Chat.find({
      members: req.params.userId
    }).populate("members", "_id username image");
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});



router.get("/messages/:userId/:otherId", async (req, res) => {
  const { userId, otherId } = req.params;
  const messages = await Message.find({
    $or: [
      { sender: userId, receiver: otherId },
      { sender: otherId, receiver: userId }
    ]
  });
  res.json(messages);
});


// router.get("/", async (req, res) => {
//   try {
//     const users = await User.find().select("-password"); 
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });  

    

router.get("/search", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.json([]); 
    

    const users = await User.find({
      username: { $regex: new RegExp(username, "i") } 
    }).select("username image"); 
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});     

        

router.get("/recent/:userId", async (req, res) => {
  try {
    const chats = await Chat.find({
      $or: [{ sender: req.params.userId }, { receiver: req.params.userId }]
    })
    .populate("sender receiver", "username image") 
    .sort({ updatedAt: -1 })
    .limit(20);   
   
    const partners = [];
    const seen = new Set();

    chats.forEach(chat => {
      const otherUser = chat.sender._id.toString() === req.params.userId
        ? chat.receiver
        : chat.sender;

      if (!seen.has(otherUser._id.toString())) {
        seen.add(otherUser._id.toString());
        partners.push(otherUser);
      }
    });

    res.json(partners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});            
   
    
router.get("/ids", async (req, res) => {
  try {
    const users = await User.find({ isDeleted: { $ne: true } })
      .select("_id"); 
    res.json(users.map(u => u._id)); 
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
       
       
export default router;   
              
                     
               