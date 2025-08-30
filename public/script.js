const socket = io();
const chatBox = document.getElementById("chat-box");
const input = document.getElementById("msg");
const sendBtn = document.getElementById("send-btn");

// Helper: add message to chat box
function addMessage(text, type) {
  const div = document.createElement("div");
  div.classList.add("message", type);
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// System messages
socket.on("chat wait", (text) => addMessage(text, "system"));
socket.on("chat start", (text) => addMessage(text, "system"));

// Stranger messages
socket.on("message", (msg) => addMessage("Stranger: " + msg, "stranger"));

// Send message
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
const newBtn = document.getElementById("new-btn");

newBtn.addEventListener("click", () => {
  socket.emit("new-stranger");
  chatBox.innerHTML = ""; // clear chat
  addMessage("⏳ Looking for a new stranger...", "system");
});

function sendMessage() {
  if (input.value.trim() !== "") {
    socket.emit("message", input.value);
    addMessage("You: " + input.value, "you");
    input.value = "";
  }
}
