import { useCallback, useState } from 'react'
import './App.css'

import ChatInput from './components/ChatInput.jsx'
import ChatWindow from './components/ChatWindow.jsx'
import EmotionDetector from './components/EmotionDetector.jsx'
import { buildSystemPrompt } from './utils/buildPrompt.js'

export default function App() {
  const [messages, setMessages] = useState([])
  const [currentEmotion, setCurrentEmotion] = useState({
    emotion: 'neutral',
    confidence: 0,
  })

  const [isWaiting, setIsWaiting] = useState(false)
  const [error, setError] = useState(null)

  const handleEmotionChange = useCallback((next) => {
    setCurrentEmotion(next)
  }, [])

  async function handleSend(userText) {
    if (isWaiting) return

    setError(null)
    setIsWaiting(true)

    const userEmotion = currentEmotion.emotion || 'neutral'
    const userConfidence = currentEmotion.confidence || 0

    const newUserMessage = {
      role: 'user',
      content: userText,
      emotion: userEmotion,
    }

    const historyForRequest = [...messages, { role: 'user', content: userText }]

    // Optimistic UI for user message.
    setMessages((prev) => [...prev, newUserMessage])

    try {
      const systemPrompt = buildSystemPrompt(userEmotion, userConfidence)

      const resp = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyForRequest,
          systemPrompt,
        }),
      })

      const data = await resp.json()

      if (!resp.ok) {
        throw new Error(data?.error || data?.message || 'Chat request failed.')
      }

      const assistantText = typeof data?.text === 'string' ? data.text : ''

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: assistantText,
          emotion: null,
        },
      ])
    } catch (err) {
      setError(err?.message || String(err))
    } finally {
      setIsWaiting(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="chat-card">
        <header className="app-header">
          <div className="app-title">Emotion-aware chat</div>
          <div className="app-subtitle">Your assistant adapts tone based on detected emotion.</div>
        </header>

        <EmotionDetector onEmotionChange={handleEmotionChange} />

        <ChatWindow messages={messages} />

        {error ? <div className="chat-error">{error}</div> : null}

        <ChatInput onSend={handleSend} disabled={isWaiting} />
      </div>
    </div>
  )
}
