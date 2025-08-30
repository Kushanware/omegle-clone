const socket = io();
const messages = document.getElementById("messages");
const input = document.getElementById("message");
const sendBtn = document.getElementById("send");
const status = document.getElementById("status");

// Receive message
socket.on("chatMessage", (msg) => {
  const div = document.createElement("div");
  div.textContent = msg;
  messages.appendChild(div);
});

// Receive error message
socket.on("errorMsg", (msg) => {
  const div = document.createElement("div");
  div.style.color = "red";
  div.textContent = msg;
  messages.appendChild(div);
});

// Enable/disable chat depending on user count
socket.on("userCount", (count) => {
  if (count > 1) {
    status.textContent = "✅ You can chat now!";
    input.disabled = false;
    sendBtn.disabled = false;
  } else {
    status.textContent = "⚠️ Waiting for another user...";
    input.disabled = true;
    sendBtn.disabled = true;
  }
});

// Send message
sendBtn.addEventListener("click", () => {
  if (input.value.trim() !== "") {
    socket.emit("chatMessage", input.value);
    input.value = "";
  }
});
