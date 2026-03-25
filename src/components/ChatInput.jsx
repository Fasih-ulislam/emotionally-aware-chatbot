import { useState } from 'react'

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (disabled) return

    const trimmed = text.trim()
    if (!trimmed) return

    onSend(trimmed)
    setText('')
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <input
        className="chat-input-field"
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your message…"
        disabled={disabled}
        aria-label="Message input"
      />
      <button className="chat-send-button" type="submit" disabled={disabled || !text.trim()}>
        {disabled ? 'Thinking…' : 'Send'}
      </button>
    </form>
  )
}

