import express, { json } from "express";
import multer from "multer";
import Group from "../models/Group.js";
import Message from "../models/Message.js";


const router = express.Router();


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });   

router.post("/create", upload.single("image"), async (req, res) => {
  try {
    const { name, members } = req.body;
    const parsedMembers = JSON.parse(members); 
  
  
//    const newGroup = new Group({
//   name,
//   members: parsedMembers,
//   image: req.file ? `/uploads/${req.file.filename}` : "/uploads/default-group.png",
// });

const newGroup = new Group({
  name,
  members: parsedMembers,
  image: req.file
    ? `${process.env.BASE_URL}/uploads/${req.file.filename}`
    : `${process.env.BASE_URL}/uploads/default-group.png`,
});

    await newGroup.save();
    res.json(newGroup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }    
});
       
      
       
router.get("/:userId", async (req, res) => {
  try {
    const groups = await Group.find({ members: req.params.userId })
      .populate("members", "username image")
      .exec();

    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message }); 
  }
});     
      
        
       
router.post("/send", async (req, res) => {
  try {
    const { sender, receiver, group, text } = req.body;

    if (!receiver && !group) {
      return res.status(400).json({ error: "Receiver or Group required" });
    } 
         
    const msg = new Message({ sender, receiver, group, text });
    await msg.save();
    const populatedMsg = await msg.populate("sender", "username image"); 
    res.json(populatedMsg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}); 
       
           
        
router.get("/:groupId/messages", async (req, res) => { 
  try {
    const messages = await Message.find({ group: req.params.groupId })
      .populate("sender", "username image");
    res.json(messages);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});    
              
 
 
export default router;
       
               
        