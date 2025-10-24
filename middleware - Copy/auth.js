// middleware/auth.js
import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET || "secret", (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    req.userId = decoded.id;
    next();
  });
};

export const socketAuth = (socket, next) => {
  const token = socket.handshake.auth?.token;
  console.log("Socket auth token:", token);

  if (!token) return next(new Error("No token"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    socket.user = decoded;
    console.log("✅ Socket authenticated:", decoded);
    next();
  } catch (err) {
    console.error("❌ JWT error:", err.message);
    next(new Error("Invalid token"));
  }
};



