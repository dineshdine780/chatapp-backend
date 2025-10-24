// import express from "express";
// import Message from "../models/Message.js";
// import { getRecentChats } from "../routes/chatController.js";
// // import { encryptText } from "../utils/encryption";
// // chatRoutes.js (ESM)
// import { encryptText, decryptText } from '../utils/encryption.js';


// const router = express.Router();

// router.get("/recent/:userId", getRecentChats);



// router.post("/initiate", async (req, res) => {
//   const { userIds } = req.body; 
//   if (!userIds || userIds.length < 2) {
//     return res.status(400).json({ error: "Need two user IDs" });
//   }

//   try {
//     let chat = await Chat.findOne({
//       members: { $all: userIds, $size: 2 }
//     });

//     if (!chat) {
//       chat = await Chat.create({ members: userIds });
//     }

//     res.json(chat);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// }); 
       
         

// // router.post("/send", async (req, res) => {
// //   try {
// //     const { sender, receiver, text } = req.body;
// //     const msg = new Message({ sender, receiver, text });
// //     await msg.save();
// //     res.json(msg);
// //   } catch (err) {
// //     res.status(400).json({ error: err.message });
// //   }
// // });  


// import { io } from "../server.js";   

// router.post("/send", async (req, res) => {
//   try {
//     const { sender, receiver, text } = req.body;

//     const encryptedText = encryptText(text);

//     const msg = new Message({ sender, receiver, text: encryptedText });
//     await msg.save();

   
//     const populatedMsg = await msg.populate("sender receiver", "username image");

//     const finalMsg = { ...populatedMsg.toObject(), text };

//     const roomId = [sender, receiver].sort().join("_");
//     io.to(roomId).emit("message", finalMsg);

//     res.json(finalMsg);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });



// router.get("/:sender/:receiver", async (req, res) => {
//   try {
//     const { sender, receiver } = req.params;
//     // const messages = await Message.find({
//     //   $or: [
//     //     { sender, receiver },
//     //     { sender: receiver, receiver: sender }
//     //   ]
//     // }).populate("sender receiver", "username");
//     // res.json(messages); 
//     const messages = await Message.find({
//   $or: [
//     { sender, receiver },
//     { sender: receiver, receiver: sender }
//   ]
// }).populate("sender receiver", "username image");

// const decryptedMessages = messages.map(m => ({
//   ...m.toObject(),
//   text: decryptText(m.text)   // 👈 decrypt before sending
// }));

// res.json(decryptedMessages);

//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });



// router.put('/delete/:id', async (req, res) => {
//   const { id } = req.params;
//   try {
//     const message = await Message.findByIdAndUpdate(
//       id,
//       { text: "This message was deleted", isDeleted: true },
//       { new: true }
//     );
//     res.json(message);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to delete message" });
//   }
// }); 
            

// export default router;     

       




import express from "express";
import Message from "../models/Message.js";
import multer from "multer";
import { encryptText, decryptText } from "../utils/encryption.js";
import { verifyToken } from "../middleware/auth.js";
import path from "path";
import fs from "fs";


const router = express.Router();


const UPLOAD_DIR = "uploads/";
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // limit 5MB
});



router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password"); // don’t send password
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});




router.post("/send", upload.single("image"), async (req, res) => {
  try {
    const { sender, receiver, text, group } = req.body;

    if (!sender) return res.status(400).json({ error: "Sender is required" });
    if (!text && !req.file) return res.status(400).json({ error: "Text or image is required" });

    const encryptedText = text ? encryptText(text) : "";

    const chatId = group ? group : receiver ? [sender, receiver].sort().join("_") : null;
    if (!chatId) return res.status(400).json({ error: "Chat ID cannot be determined" });

    const msg = new Message({
      sender,
      receiver: receiver || null,
      group: group || null,
      chatId,
      text: encryptedText,
      image: req.file ? `/uploads/${req.file.filename}` : null,
    });

    await msg.save();

    const populatedMsg = await msg.populate("sender receiver", "username image");
    const finalMsg = { ...populatedMsg.toObject(), text };

    // Emit message via Socket.io
    const io = req.app.get("io");
    io.to(chatId).emit("message", finalMsg);

    res.json(finalMsg);
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: err.message });
  }
}); 

   
       
router.get("/:sender/:receiver", async (req, res) => {
  try {
    const { sender, receiver } = req.params;
    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    }).populate("sender receiver", "username image");

    const decryptedMsgs = messages.map((m) => ({
      ...m.toObject(),
      text: decryptText(m.text),
    }));

    res.json(decryptedMsgs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});  

   

router.put("/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const message = await Message.findByIdAndUpdate(
      id,
      { text: "This message was deleted", isDeleted: true },
      { new: true }
    );
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: "Failed to delete message" });
  }
}); 
       
router.get("/:chatId/messages", async (req, res) => {
  try {
    const userId = req.user._id; 
    const chatId = req.params.chatId;

           
    
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    
    if (!chat.members.includes(userId)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});  
     


export default router;
                      
                      
