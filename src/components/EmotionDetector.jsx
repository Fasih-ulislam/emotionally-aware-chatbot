import { useEffect } from 'react'
import useEmotion from '../hooks/useEmotion.js'

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

const EMOTION_LABELS = {
  happy: 'Happy',
  sad: 'Sad',
  angry: 'Angry',
  fearful: 'Fearful',
  disgusted: 'Disgusted',
  surprised: 'Surprised',
  neutral: 'Neutral',
}

export default function EmotionDetector({ onEmotionChange }) {
  const { emotion, confidence, videoRef, canvasRef, isLoading, error } = useEmotion()

  useEffect(() => {
    if (typeof onEmotionChange === 'function') {
      onEmotionChange({ emotion, confidence })
    }
  }, [emotion, confidence, onEmotionChange])

  return (
    <aside className="emotion-detector" aria-label="Emotion detector">
      <div className="emotion-media">
        <video ref={videoRef} className="emotion-video" autoPlay muted playsInline />
        <canvas ref={canvasRef} className="emotion-canvas" />

        {isLoading ? <div className="emotion-loading">Loading emotion…</div> : null}
        {error ? <div className="emotion-loading error">{error}</div> : null}
      </div>

      <div className="emotion-meta">
        <div className={`emotion-badge emotion-${emotion}`}>
          <span className="emotion-badge-label">{isLoading ? 'Detecting…' : EMOTION_LABELS[emotion] || emotion}</span>
        </div>
        <div className="emotion-emoji">{getEmotionEmoji(emotion)}</div>
        {!isLoading && confidence ? (
          <div className="emotion-confidence">{Math.round(confidence * 100)}%</div>
        ) : null}
      </div>
    </aside>
  )
}

