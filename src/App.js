import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // backend running on 5000

function App() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState(localStorage.getItem("chatName") || "");
  const [strangerConnected, setStrangerConnected] = useState(false);

  useEffect(() => {
    socket.on("chat message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("stranger connected", () => {
      setStrangerConnected(true);
      setMessages((prev) => [...prev, { system: true, text: "🔗 Stranger connected!" }]);
    });

    socket.on("stranger disconnected", () => {
      setStrangerConnected(false);
      setMessages((prev) => [...prev, { system: true, text: "❌ Stranger disconnected!" }]);
    });

    return () => {
      socket.off("chat message");
      socket.off("stranger connected");
      socket.off("stranger disconnected");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      const msgObj = { user: username || "You", text: message };
      socket.emit("chat message", msgObj);
      setMessages((prev) => [...prev, msgObj]);
      setMessage("");
    }
  };

  const handleSetName = () => {
    if (username.trim()) {
      localStorage.setItem("chatName", username);
    }
  };

  const findNewStranger = () => {
    socket.emit("find stranger");
    setMessages([]);
  };

  return (
    <div className="h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-400 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold text-white mb-4">🎭 Stranger Chat</h1>

      {/* Name Input */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your name"
          className="p-2 rounded-lg border-2 border-white focus:outline-none"
        />
        <button
          onClick={handleSetName}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          Save Name
        </button>
      </div>

      {/* Messages Box */}
      <div className="bg-white w-full max-w-lg flex-1 rounded-lg shadow-lg p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            {msg.system ? (
              <p className="text-center text-gray-500 italic">{msg.text}</p>
            ) : (
              <p>
                <span className="font-bold text-purple-600">{msg.user}: </span>
                {msg.text}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="flex gap-2 mt-4 w-full max-w-lg">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 rounded-lg border-2 border-white focus:outline-none"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Send
        </button>
      </div>

      {/* Find Stranger */}
      <button
        onClick={findNewStranger}
        className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg"
      >
        🔄 Find New Stranger
      </button>
    </div>
  );
}

export default App;
