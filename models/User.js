import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, },
  bio: { type: String },
  email:    { type: String, required: true, unique: true },
  image: { type: String, default: "" },
  password: { type: String, required: true },
  
}, { timestamps: true });
      
export default mongoose.model("User", userSchema); 
       
       