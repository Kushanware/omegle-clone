const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve frontend (public folder)
app.use(express.static("public"));

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Match users
  if (waitingUser) {
    const room = socket.id + "#" + waitingUser.id;
    socket.join(room);
    waitingUser.join(room);

    io.to(room).emit("chat start", "✅ You are now connected to a stranger!");
    waitingUser = null;
  } else {
    waitingUser = socket;
    socket.emit("chat wait", "⏳ Waiting for a stranger...");
  }

  // Receive messages
  socket.on("message", (msg) => {
    const rooms = [...socket.rooms].filter(r => r !== socket.id);
    rooms.forEach(room => io.to(room).emit("message", msg));
  });

  // Find new stranger
  socket.on("new-stranger", () => {
    if (waitingUser === socket) waitingUser = null;

    // Leave all current rooms
    const rooms = [...socket.rooms].filter(r => r !== socket.id);
    rooms.forEach(room => socket.leave(room));

    // Match with a waiting user or wait
    if (waitingUser) {
      const room = socket.id + "#" + waitingUser.id;
      socket.join(room);
      waitingUser.join(room);
      io.to(room).emit("chat start", "✅ You are now connected to a stranger!");
      waitingUser = null;
    } else {
      waitingUser = socket;
      socket.emit("chat wait", "⏳ Waiting for a stranger...");
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (waitingUser === socket) waitingUser = null;
    socket.broadcast.emit("message", "❌ Stranger disconnected.");
  });
});

// Start server
server.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
