import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble.jsx'

export default function ChatWindow({ messages }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  return (
    <div className="chat-window" role="log" aria-live="polite">
      {messages.map((m, idx) => (
        <MessageBubble
          key={`${m.role}-${idx}`}
          role={m.role}
          content={m.content}
          emotion={m.emotion}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

