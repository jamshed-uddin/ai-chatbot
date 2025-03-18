import { useState, useRef, useEffect } from "react";

// Only use named export, no default export
function Chatbox() {
  const [messages, setMessages] = useState([
    {
      content: "Hello! How can I help you today?",
      sender: "assistant",
    },
  ]);

  const [messageStreaming, setMessageStreaming] = useState(false);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === "") return;

    // Add user message
    const userMessage = {
      content: input,
      sender: "user",
    };
    const aiMessage = {
      content: "",
      sender: "assistent",
    };
    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setInput("");

    // Simulate assistant response (in a real app, this would call an API)
    setMessageStreaming(true);
    try {
      const response = await fetch("http://localhost:8000/api/query", {
        method: "POST",
        body: JSON.stringify({ userMessage: userMessage }),
        headers: { "Content-Type": "application/json" },
      });
      const reader = response.body.getReader();
      console.log(reader);
      const decoder = new TextDecoder();
      let newMessageText = "";
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          setMessageStreaming(false);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        newMessageText += chunk;

        setMessages((prev) => {
          const updatedMessages = [...prev];
          updatedMessages.at(-1).content = newMessageText;
          return updatedMessages;
        });
        console.log(chunk);
      }
    } catch (error) {
      console.log(error);
      setMessageStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto p-4 ">
      <div className=" rounded-lg shadow-lg flex flex-col h-full overflow-hidden border border-gray-200 backdrop-blur-[50px]">
        {/* Chat header */}
        <div className="p-4 border-b border-gray-200  text-primary-foreground rounded-t-lg">
          <h2 className="text-xl font-semibold">Echo</h2>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 ">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 animate-fadeIn flex items-center gap-1 ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none bg-gray-200"
                    : "text-gray-800 rounded-tl-none"
                }`}
              >
                <div> {message.content}</div>
                {idx !== 0 && message.sender !== "user" && messageStreaming && (
                  <div className="w-4 h-4 rounded-full bg-black"></div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-3 border-t border-gray-200 ">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 focus:outline-0"
            />
            <button onClick={handleSend} disabled={input.trim() === ""}>
              s
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chatbox;
