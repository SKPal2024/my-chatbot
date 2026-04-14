const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");

// Add message to chat box
function addMessage(sender, text) {
  const div = document.createElement("div");
  div.className = "message " + (sender === "You" ? "user" : "bot");
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Send message to backend
async function sendMessage() {
  const msg = userInput.value.trim();
  if (!msg) return;

  addMessage("You", msg);
  userInput.value = "";

  const botDiv = document.createElement("div");
  botDiv.className = "message bot";
  botDiv.textContent = "Thinking...";
  chatBox.appendChild(botDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const res = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg })
    });
    const data = await res.json();
    botDiv.textContent = data.reply;
  } catch (err) {
    botDiv.textContent = "⚠️ Error: " + err.message;
  }
}

// Press Enter to send
userInput.addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });
