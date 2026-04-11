import { useCallback, useState, useRef } from "react";

// Hook for managing text-to-speech with emotion-aware audio from ElevenLabs
export default function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);

  // Fetch emotion-aware audio from server and play it
  const speak = useCallback(async (text, emotion = "neutral") => {
    if (!text || text.trim() === "") {
      return;
    }

    // Stop any currently playing audio before starting new playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    try {
      // Request emotion-aware audio from backend
      const response = await fetch("http://localhost:3001/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, emotion }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "TTS request failed");
      }

      // Convert response to audio blob and create playable URL
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Update state when audio starts playing (for lip sync timing)
      audio.onplay = () => {
        setIsSpeaking(true);
      };

      audio.onended = () => {
        // Clean up when audio finishes
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audio.onerror = () => {
        // Handle playback errors gracefully
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();
    } catch (error) {
      // Fall back to browser TTS if server request fails
      setIsSpeaking(false);
      fallbackSpeak(text, emotion, setIsSpeaking);
    }
  }, []);

  // Stop current playback and clear state
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}

// Fallback to browser native TTS with emotion-based voice adjustment
// Used when ElevenLabs request fails due to network or server issues
function fallbackSpeak(text, emotion, setIsSpeaking) {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);

  // Adjust speech rate and pitch based on emotion for natural sounding speech
  switch (emotion) {
    case "happy":
      utterance.rate = 1.4;
      utterance.pitch = 1.6;
      break;
    case "sad":
      utterance.rate = 0.7;
      utterance.pitch = 0.6;
      break;
    case "angry":
      utterance.rate = 1.5;
      utterance.pitch = 0.7;
      break;
    case "surprised":
      utterance.rate = 1.5;
      utterance.pitch = 1.7;
      break;
    default:
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
  }

  utterance.onstart = () => setIsSpeaking(true);
  utterance.onend = () => setIsSpeaking(false);

  window.speechSynthesis.speak(utterance);
}
