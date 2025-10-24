
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },
    // text: { type: String, required: true }, 
    text: { type: String, default: "" }, 
    image: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
    
  },
  { timestamps: true } 
);     
       
        
export default mongoose.model("Message", messageSchema);
      
       
      