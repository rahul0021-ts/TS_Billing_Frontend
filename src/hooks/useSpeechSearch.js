import { useState, useRef, useCallback } from 'react'

/**
 * useSpeechSearch
 * Uses the browser Web Speech API to capture voice input and return it as text.
 * Works best on Chrome (desktop + Android). Safari has partial support.
 * Firefox does NOT support SpeechRecognition.
 */
export function useSpeechSearch({ onResult, onError, lang = 'en-IN' } = {}) {
  const [listening, setListening] = useState(false)
  const [supported] = useState(() => 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  const recognitionRef = useRef(null)

  const start = useCallback(() => {
    if (!supported) {
      onError?.('Speech recognition is not supported in this browser. Use Chrome.')
      return
    }
    if (listening) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang           = lang        // 'hi-IN' for Hindi, 'en-IN' for English
    recognition.continuous     = false        // stop after first result
    recognition.interimResults = false        // only final results
    recognition.maxAlternatives = 1

    recognition.onstart = () => setListening(true)

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim()
      onResult?.(transcript)
      setListening(false)
    }

    recognition.onerror = (event) => {
      setListening(false)
      if (event.error === 'no-speech') {
        onError?.('No speech detected. Try again.')
      } else if (event.error === 'not-allowed') {
        onError?.('Microphone permission denied. Allow mic in browser settings.')
      } else {
        onError?.(`Voice error: ${event.error}`)
      }
    }

    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
  }, [supported, listening, onResult, onError, lang])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  return { listening, supported, start, stop }
}
