const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve frontend (public folder)
app.use(express.static("public"));

const waitingUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.mood = null;

  // Set mood and try to match
  socket.on("set-mood", (mood) => {
    socket.mood = mood;
    matchUser(socket);
  });

  // Find new stranger with mood
  socket.on("new-stranger", (mood) => {
    leaveAllRooms(socket);
    socket.mood = mood;
    matchUser(socket);
  });

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
function matchUser(socket) {
  if (!socket.mood) {
    socket.emit("chat wait", "⏳ Please select a mood to start.");
    return;
  }
  if (!waitingUsers[socket.mood]) waitingUsers[socket.mood] = [];
  // Try to find a waiting user with the same mood
  const queue = waitingUsers[socket.mood];
  while (queue.length > 0) {
    const partner = queue.shift();
    if (partner.connected) {
      const room = socket.id + "#" + partner.id;
      socket.join(room);
      partner.join(room);
      io.to(room).emit("chat start", `✅ You are now connected to a stranger! (Mood: ${socket.mood})`);
      return;
    }
  }
  // No partner found, add to waiting queue
  queue.push(socket);
  socket.emit("chat wait", `⏳ Waiting for a stranger with mood: ${socket.mood} ...`);
}

function leaveAllRooms(socket) {
  const rooms = [...socket.rooms].filter(r => r !== socket.id);
  rooms.forEach(room => socket.leave(room));
  removeWaitingUser(socket);
}

function removeWaitingUser(socket) {
  if (socket.mood && waitingUsers[socket.mood]) {
    waitingUsers[socket.mood] = waitingUsers[socket.mood].filter(s => s.id !== socket.id);
  }
}

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
// This file is required for Socket.IO client to work in the browser.
