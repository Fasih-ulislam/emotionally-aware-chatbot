import { useCallback, useState } from "react";
import "./App.css";
import ChatInput from "./components/ChatInput.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import EmotionDetector from "./components/EmotionDetector.jsx";
import Avatar from "./components/Avatar.jsx";
import { buildSystemPrompt } from "./utils/buildPrompt.js";
import useSpeech from "./hooks/useSpeech.js";

// Main app component - coordinates emotion detection, chat, and audio response
export default function App() {
  const { speak, stop, isSpeaking } = useSpeech();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi there! I'm your emotionally intelligent assistant. I can see how you're feeling through your camera and I'll do my best to respond in a way that suits your mood. Feel free to share whatever's on your mind. I'm here to listen and help.",
      emotion: null,
    },
  ]);
  const [currentEmotion, setCurrentEmotion] = useState({
    emotion: "neutral",
    confidence: 0,
  });

  const [isWaiting, setIsWaiting] = useState(false);
  const [error, setError] = useState(null);

  const handleEmotionChange = useCallback((next) => {
    // Update current user emotion detected from webcam
    setCurrentEmotion(next);
  }, []);

  // Handle sending user message to chat API with emotion context
  async function handleSend(userText) {
    if (isWaiting) return;

    setError(null);
    setIsWaiting(true);

    const userEmotion = currentEmotion.emotion || "neutral";
    const userConfidence = currentEmotion.confidence || 0;

    // Store user message with detected emotion
    const newUserMessage = {
      role: "user",
      content: userText,
      emotion: userEmotion,
    };

    const historyForRequest = [
      ...messages,
      { role: "user", content: userText },
    ];

    setMessages((prev) => [...prev, newUserMessage]);

    try {
      // Build system prompt that instructs model to respond to detected emotion
      const systemPrompt = buildSystemPrompt(userEmotion, userConfidence);

      // Send conversation context and emotion to backend
      const resp = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyForRequest,
          systemPrompt,
          emotion: { label: userEmotion, score: userConfidence },
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data?.error || data?.message || "Chat request failed.");
      }

      const assistantText = typeof data?.text === "string" ? data.text : "";

      // Play assistant response with emotion-aware voice
      speak(assistantText, userEmotion);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantText,
          emotion: null,
        },
      ]);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setIsWaiting(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="chat-card">
        <header className="app-header">
          <div className="app-title">
            Emotion-aware chat
            {isSpeaking && <span className="speaking-badge">🔊</span>}
          </div>
          <div className="app-subtitle">
            Your assistant adapts tone based on detected emotion.
            {isSpeaking && (
              <button className="stop-btn" onClick={stop} type="button">
                ⏹️ Stop
              </button>
            )}
          </div>
        </header>

        <div className="main-content">
          <div className="chat-section">
            <ChatWindow messages={messages} />
            {error && <div className="chat-error">{error}</div>}
            <ChatInput onSend={handleSend} disabled={isWaiting} />
          </div>

          <div className="right-panel">
            <Avatar emotion={currentEmotion.emotion} isSpeaking={isSpeaking} />
            <EmotionDetector onEmotionChange={handleEmotionChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
