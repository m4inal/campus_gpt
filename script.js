// Select elements
const sendBtn = document.getElementById("send-btn");
const userInput = document.getElementById("user-input");
const chatMessages = document.getElementById("chat-messages");

// Function to add a new message to the chat
function addMessage(message, sender = "user") {
  const messageWrapper = document.createElement("div");
  messageWrapper.classList.add("flex", "items-start", "gap-3");

  if (sender === "ai") {
    messageWrapper.innerHTML = `
      <div class="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
          stroke-linecap="round" stroke-linejoin="round" 
          class="lucide lucide-robot w-5 h-5 text-primary-foreground">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
          <path d="M12 10V6"/>
          <path d="M10 16a2 2 0 0 1-2-2h8a2 2 0 0 1-2 2z"/>
          <path d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
        </svg>
      </div>
      <div class="bg-muted p-4 rounded-xl max-w-lg">
        <p class="text-sm">${message}</p>
      </div>
    `;
  } else {
    messageWrapper.classList.add("justify-end");
    messageWrapper.innerHTML = `
      <div class="bg-primary text-white p-4 rounded-xl max-w-lg">
        <p class="text-sm">${message}</p>
      </div>
    `;
  }

  chatMessages.appendChild(messageWrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to send message to Ollama with educational guardrails
async function sendToOllama(message) {
  try {
    addMessage("Thinking...", "ai");
    const lastAiMessage = chatMessages.lastElementChild;

    // This is the system prompt that defines the AI's rules and persona.
    const systemPrompt = `You are Campus GPT, a friendly and helpful AI assistant for students. Your sole purpose is to answer questions related to academic subjects, education, science, technology, history, and literature. 

    Your rules are:
    1.  You MUST strictly stick to educational topics.
    2.  If a user asks a question that is NOT related to an academic or educational subject (e.g., asking about celebrity gossip, personal opinions, inappropriate topics, or casual conversation), you MUST politely refuse.
    3.  When you refuse, you should respond with something like: "I can only answer questions related to educational topics. How can I help you with your studies?"
    4.  Do not engage in debates or discussions outside of the educational scope.`;

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: message,
        // We add the system prompt here to enforce the rules
        system: systemPrompt,
        stream: false
      })
    });

    if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    const text = data.response || "I had trouble understanding that. Could you rephrase?";

    lastAiMessage.querySelector('p').textContent = text;

  } catch (error) {
    console.error("Ollama API Error:", error);
    const lastAiMessage = chatMessages.lastElementChild;
    if (lastAiMessage && lastAiMessage.querySelector('p').textContent === "Thinking...") {
      lastAiMessage.querySelector('p').textContent = "Oops! Something went wrong. Check the console (F12) for details.";
    } else {
      addMessage("Oops! Something went wrong. Check the console (F12) for details.", "ai");
    }
  }
}

// Event listener for send button
sendBtn.addEventListener("click", () => {
  const message = userInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  userInput.value = "";
  sendToOllama(message);
});

// Press Enter to send
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendBtn.click();
});
