// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import dotenv, { populate } from "dotenv";
// import http from "http";
// import { Server } from "socket.io";
// import jwt from "jsonwebtoken";
// import path from "path";
// import { fileURLToPath } from "url";
// import CryptoJS from "crypto-js";
// import { encryptText, decryptText } from "./utils/encryption.js";
// import { socketAuth } from "./middleware/auth.js";



// import authRoutes from "./routes/authRoutes.js";
// import chatRoutes from "./routes/chatRoutes.js";
// import userRoutes from "./routes/userRoutes.js";
// import groupRoutes from "./routes/groupRoutes.js";


// import Message from "./models/Message.js";
// import { posix } from "path"; 





// const encrypted = encryptText("mypassword");
// const decrypted = decryptText(encrypted);

// // app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// // app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// dotenv.config();
// const app = express();
// app.use(express.json()); 


// const allowedOrigins = [
//   "http://localhost:3000",
//   "http://127.0.0.1:3000",
//   "http://192.168.1.110:3000",
// ]; 

  
    
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("CORS not allowed"));
//       }
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE"], 
//   })
// ); 


// app.use("/api/auth", authRoutes);
// app.use("/api/chat", chatRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/group", groupRoutes); 


// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: { origin: allowedOrigins, credentials: true },
// });   

// app.set("io", io);

// // export const io = new Server(server, {
// //   cors: { origin: allowedOrigins, credentials: true },
// // });





// const onlineUsers = new Map();

// // socket.on("register", (userId) => {
// //   onlineUsers.set(userId, socket.id);
// //   io.emit("onlineUsers", Array.from(onlineUsers.keys())); 
// // });  

// io.use(socketAuth);

// io.use((socket, next) => {
//   const token = socket.handshake.auth?.token;
//   if (!token) return next(new Error("No token"));

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     socket.user = decoded;
//     next();
//   } catch (err) {
//     console.error("JWT error:", err.message);
//     next(new Error("Invalid token"));
//   }
// });
    
   
   
// io.on("connection", (socket) => {
//   console.log("New client connected", socket.id);

//   // Register user and join personal room
//   socket.on("register", (userId) => {
//     onlineUsers.set(userId, socket.id);
//     socket.join(userId); // personal room
//     io.emit("onlineUsers", Array.from(onlineUsers.keys()));
//   });

//   // Join a chat room (group or private)
//  socket.on("joinChat", (roomId) => {
//   console.log(`${socket.id} joining room:`, roomId); // ✅ debug
//   socket.join(roomId);
// });


//   // Send message
//   socket.on("sendMessage", async (msg) => {
//     try {
//       const senderId = msg.sender;
//       const receiverId = msg.receiver || null;
//       const groupId = msg.group || null;
//       const chatRoom = msg.chatId; // client must send correct chatId

//       // Echo temp message to sender immediately
//       socket.emit("message", { ...msg, status: "pending" });

//       // Save message in DB
//       const newMessage = await Message.create({
//         sender: senderId,
//         receiver: receiverId,
//         group: groupId,
//         chatId: chatRoom,
//         text: msg.text,
//         image: msg.image || null,
//       });

//       const populatedMsg = await newMessage.populate([
//         { path: "sender", select: "username image" },
//         { path: "receiver", select: "username image" },
//       ]); 
       
//       // Emit to everyone in room
//       io.to(chatRoom).emit("message", populatedMsg);

//       // For private messages: emit directly to receiver if online
//       if (!groupId && receiverId) {
//         const receiverSocket = onlineUsers.get(receiverId);
//         if (receiverSocket) io.to(receiverSocket).emit("message", populatedMsg);
//       }

//     } catch (err) {
//       console.error("sendMessage error:", err.message);
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log("Client disconnected", socket.id);
//     onlineUsers.forEach((sId, uId) => {
//       if (sId === socket.id) onlineUsers.delete(uId);
//     });
//     io.emit("onlineUsers", Array.from(onlineUsers.keys()));
//   });
// });   
  
        
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log(" MongoDB Connected");
//     server.listen(process.env.PORT || 5000, () => {
//       console.log(`Server running on port ${process.env.PORT || 5000}`);
//     });
//   })
//   .catch((err) => console.error("MongoDB error:", err.message));  







 
 
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import path from 'path';
import fs from 'fs';

import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import Message from "./models/Message.js";


dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://192.168.1.110:3000",
  "capacitor://localhost", 
  "ionic://localhost",     
  "file://",
]; 
   


app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/group", groupRoutes);  


const __dirname = path.resolve();  


app.use("/uploads", express.static(path.join(__dirname, "uploads"))); 


const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});
    
app.set("io", io);

const onlineUsers = new Map(); 

io.on("connection", (socket) => {
  console.log(" Client connected:", socket.id);  
  
  socket.on("register", (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.join(userId); 
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });
   
   
  socket.on("joinChat", (roomId) => {
    console.log(`${socket.id} joined room:`, roomId);
    socket.join(roomId);
  });
   
     
   
  socket.on("sendMessage", async (msg) => {
    try {
      const { sender, receiver, group, chatId, text, image, clientId } = msg;
     
      const newMessage = await Message.create({ sender, receiver, group, chatId, text, image: image || null });
      const populatedMsg = await newMessage.populate([
        { path: "sender", select: "username image" },
        { path: "receiver", select: "username image" },
      ]);
   
      populatedMsg.clientId = clientId; 
   
      io.to(chatId).emit("message", populatedMsg); 
      
      if (!group && receiver) {
        const receiverSocket = onlineUsers.get(receiver);
        if (receiverSocket) io.to(receiverSocket).emit("message", populatedMsg);
      }
    } catch (err) { 
      console.error("sendMessage error:", err.message);
    }
  }); 

         
          
  socket.on("disconnect", () => {
    console.log(" Client disconnected", socket.id);
    onlineUsers.forEach((sId, uId) => { if (sId === socket.id) onlineUsers.delete(uId); });
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });    
});    
              
        
         
mongoose.connect(process.env.MONGO_URI)   
  .then(() => {
    console.log(" MongoDB Connected");
    server.listen(process.env.PORT || 5000, () => console.log(` Server running on port ${process.env.PORT || 5000}`));
  })
  .catch(err => console.error("MongoDB error:", err.message));       
        
           
  