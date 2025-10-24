import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({

  name: { type: String, required: true },
  image: { type: String, default: "" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Group", groupSchema); 

