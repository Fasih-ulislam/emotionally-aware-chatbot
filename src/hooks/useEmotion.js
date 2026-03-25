import { useEffect, useRef, useState } from 'react'
import * as faceapi from 'face-api.js'

const EMOTION_KEYS = [
  'happy',
  'sad',
  'angry',
  'fearful',
  'disgusted',
  'surprised',
  'neutral',
]

function pickTopEmotion(expressions) {
  if (!expressions) return { emotion: 'neutral', confidence: 0 }

  let bestKey = 'neutral'
  let bestScore = 0

  for (const key of EMOTION_KEYS) {
    const score = typeof expressions[key] === 'number' ? expressions[key] : 0
    if (score > bestScore) {
      bestScore = score
      bestKey = key
    }
  }

  return { emotion: bestKey, confidence: bestScore }
}

export default function useEmotion() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const [emotion, setEmotion] = useState('neutral')
  const [confidence, setConfidence] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    let stream = null
    let intervalId = null
    let displaySize = { width: 0, height: 0 }
    let updateDisplaySize = null

    async function init() {
      const videoEl = videoRef.current
      const canvasEl = canvasRef.current

      if (!videoEl || !canvasEl) {
        setError('Missing video/canvas element refs.')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Load required face-api models from /public/models/.
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
        await faceapi.nets.faceExpressionNet.loadFromUri('/models')

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })
        videoEl.srcObject = stream

        await new Promise((resolve) => {
          videoEl.onloadedmetadata = () => {
            videoEl.play().finally(resolve)
          }
        })

        updateDisplaySize = () => {
          const rect = videoEl.getBoundingClientRect()
          displaySize = {
            width: Math.max(1, rect.width),
            height: Math.max(1, rect.height),
          }
          faceapi.matchDimensions(canvasEl, displaySize)
        }

        updateDisplaySize()
        window.addEventListener('resize', updateDisplaySize)

        intervalId = setInterval(async () => {
          if (!mounted) return

          // Always clear between frames for a clean overlay.
          const ctx = canvasEl.getContext('2d')
          ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)

          const detection = await faceapi
            .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions()

          if (!detection) return

          const resizedDetection = faceapi.resizeResults(
            detection,
            displaySize,
          )
          faceapi.draw.drawDetections(canvasEl, resizedDetection)

          const top = pickTopEmotion(detection.expressions)
          setEmotion(top.emotion)
          setConfidence(top.confidence)
        }, 500)

        setIsLoading(false)

      } catch (err) {
        setError(err?.message || String(err))
        setIsLoading(false)
      }
    }

    init()

    return () => {
      mounted = false
      if (intervalId) clearInterval(intervalId)
      if (updateDisplaySize) window.removeEventListener('resize', updateDisplaySize)
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  return {
    emotion,
    confidence,
    videoRef,
    canvasRef,
    isLoading,
    error,
  }
}

