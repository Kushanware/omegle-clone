const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let allUsers = {}; // socket.id => { name, status }
let waitingQueue = []; // Users waiting for a stranger

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.username = "Anonymous";
    allUsers[socket.id] = { name: socket.username, status: "online" };
    io.emit("userList", allUsers);

    // Set name
    socket.on("setName", (name) => {
        socket.username = name;
        allUsers[socket.id].name = name;
        io.emit("userList", allUsers);
        findStranger(socket);
    });

    // Find new stranger
    socket.on("findStranger", () => {
        leaveRoom(socket);
        findStranger(socket);
    });

    // Chat messages
    socket.on("message", (msg) => {
        if (!socket.partner) {
            socket.emit("systemMessage", "❌ No stranger connected. Can't send message.");
            return;
        }
        const room = [...socket.rooms].find(r => r.includes("#"));
        if (room) {
            socket.to(room).emit("message", { from: socket.username, text: msg });
        }
    });

    // Disconnect
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        if (socket.partner) {
            const partnerSocket = io.sockets.sockets.get(socket.partner);
            if (partnerSocket) {
                partnerSocket.emit("partnerDisconnected");
                partnerSocket.partner = null;
                allUsers[partnerSocket.id].status = "online";
            }
        }
        removeFromQueue(socket);
        delete allUsers[socket.id];
        io.emit("userList", allUsers);
    });

    // Helper functions
    function findStranger(s) {
        removeFromQueue(s);

        const waiting = waitingQueue.find(u => u.id !== s.id && !u.partner);
        if (waiting) {
            const room = s.id + "#" + waiting.id;
            s.join(room);
            waiting.join(room);
            s.partner = waiting.id;
            waiting.partner = s.id;

            s.emit("strangerFound", waiting.username);
            waiting.emit("strangerFound", s.username);

            allUsers[s.id].status = "chatting";
            allUsers[waiting.id].status = "chatting";
            io.emit("userList", allUsers);
        } else {
            waitingQueue.push(s);
            s.emit("waiting");
            allUsers[s.id].status = "waiting";
            io.emit("userList", allUsers);
        }
    }

    function leaveRoom(s) {
        const rooms = [...s.rooms].filter(r => r !== s.id);
        rooms.forEach(r => s.leave(r));
        if (s.partner) {
            const partnerSocket = io.sockets.sockets.get(s.partner);
            if (partnerSocket) {
                partnerSocket.emit("partnerDisconnected");
                partnerSocket.partner = null;
                allUsers[partnerSocket.id].status = "online";
            }
            s.partner = null;
        }
    }

    function removeFromQueue(s) {
        waitingQueue = waitingQueue.filter(u => u.id !== s.id);
    }
});

server.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
});
