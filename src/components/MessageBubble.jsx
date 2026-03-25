function getEmotionEmoji(emotion) {
  switch (emotion) {
    case 'happy':
      return '😊'
    case 'sad':
      return '😢'
    case 'angry':
      return '😠'
    case 'fearful':
      return '😨'
    case 'disgusted':
      return '😖'
    case 'surprised':
      return '😮'
    case 'neutral':
    default:
      return '🙂'
  }
}

export default function MessageBubble({ role, content, emotion }) {
  const isUser = role === 'user'

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
        {isUser && emotion ? (
          <div className={`message-emotion-tag emotion-${emotion}`}>
            <span className="message-emotion-emoji">{getEmotionEmoji(emotion)}</span>
            <span className="message-emotion-text">{emotion}</span>
          </div>
        ) : null}

        <div className="message-content">{content}</div>
      </div>
    </div>
  )
}

