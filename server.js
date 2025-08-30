const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
// Serve static files from the public directory
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

let waitingUser = null;

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Default name
  socket.data.name = "Anonymous";

  // Set display name
  socket.on("setName", (name) => {
    socket.data.name = name?.trim() || "Anonymous";
  });

  // Match with stranger
  socket.on("findStranger", () => {
    if (waitingUser && waitingUser.id !== socket.id) {
      const partner = waitingUser;
      waitingUser = null;

      // Save partner references
      socket.partner = partner;
      partner.partner = socket;

      // Notify both
      socket.emit("strangerFound", partner.data.name);
      partner.emit("strangerFound", socket.data.name);
    } else {
      waitingUser = socket;
      socket.emit("waiting");
    }
  });

  // Relay message to partner
  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", {
        text: msg,
        from: socket.data.name,
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    // Notify partner if exists
    if (socket.partner) {
      socket.partner.emit("partnerDisconnected");
      socket.partner.partner = null;
    }

    // Clear waiting user if leaving
    if (waitingUser && waitingUser.id === socket.id) {
      waitingUser = null;
    }
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
