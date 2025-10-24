import Chat from "../models/User.js";

export const getRecentChats = async (req, res) => {
  try {
    const { userId } = req.params;
    const chats = await Chat.find({ members: userId })
      .populate("members", "username image")
      .sort({ updatedAt: -1 })
      .limit(10);

    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: "Error fetching recent chats" });
  }
};

  
