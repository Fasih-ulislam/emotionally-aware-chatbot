const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { GoogleGenerativeAI } = require('@google/generative-ai')

dotenv.config()

const app = express()

app.use(
  cors({
    origin: 'http://localhost:5173',
  }),
)
app.use(express.json({ limit: '1mb' }))

const GEMINI_MODEL = 'gemini-2.0-flash-lite'

function toGeminiHistory(messages) {
  const filtered = Array.isArray(messages)
    ? messages.filter(
        (m) =>
          m &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string',
      )
    : []

  const history = filtered.map((m) => {
    if (m.role === 'user') {
      return { role: 'user', parts: [{ text: m.content }] }
    }
    // Gemini uses "model" for assistant turns.
    return { role: 'model', parts: [{ text: m.content }] }
  })

  // Gemini requires the first turn to be from "user". Be defensive.
  if (history.length === 0) {
    return [{ role: 'user', parts: [{ text: '' }] }]
  }
  if (history[0].role !== 'user') {
    history.unshift({ role: 'user', parts: [{ text: '' }] })
  }

  return history
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body || {}

    if (!process.env.GEMINI_API_KEY) {
      return res
        .status(500)
        .json({ error: 'Missing GEMINI_API_KEY in .env' })
    }
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: '`messages` must be an array' })
    }
    if (typeof systemPrompt !== 'string') {
      return res.status(400).json({ error: '`systemPrompt` must be a string' })
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: systemPrompt,
    })

    const result = await model.generateContent({
      contents: toGeminiHistory(messages),
    })

    const text = result?.response?.text?.() || ''

    return res.json({ text })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
    return res.status(500).json({
      error: err?.message || String(err),
    })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Emotion chat server running on http://localhost:${PORT}`)
})

