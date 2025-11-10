     
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { encryptText, decryptText } from "../utils/encryption.js";

const router = express.Router(); 

      

router.post("/signup", async (req, res) => {
  console.log("Received body:", req.body);
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing username, email, or password" });
    }

    
    const existingUsers = await User.find();
    for (let u of existingUsers) {
      if (decryptText(u.email) === email) {
        return res.status(400).json({ error: "Email already exists" });
      }
    } 

          
    const hashedPass = await bcrypt.hash(password, 10);
    
    const encryptedUsername = encryptText(username);
    const encryptedEmail = encryptText(email);      

     
    const user = new User({
      username: encryptedUsername,
      email: encryptedEmail,
      password: hashedPass,
    });
    await user.save();


    const decryptedUser = {
      _id: user._id,
      username,
      email,
    };      
      

    const token = jwt.sign(
      { id: user._id, email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );  

    res.json({ token, user: decryptedUser });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});
       
      
        
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    

    const users = await User.find();
    let user = null;
    for (let u of users) {
      if (decryptText(u.email) === email) {
        user = u;
        break;
      }
    }  
       
       
        
    if (!user) return res.status(404).json({ error: "User not found" });
       
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
       
    const decryptedUser = {
      _id: user._id,
      username: decryptText(user.username),
      email: decryptText(user.email), 
    }; 
    
    
    
    const token = jwt.sign(
      { id: user._id, email: decryptedUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } 
    );
       
    res.json({ token, user: decryptedUser });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error" });
  }    
});      
       
                                 
export default router;               
       
             
       