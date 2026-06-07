import { useState, useRef } from 'react'
import { Mic, MicOff } from 'lucide-react'

const MAKES = ['Toyota', 'Nissan', 'Honda', 'BMW', 'Mercedes', 'Hyundai', 'Kia', 'Ford', 'Chevrolet', 'Mitsubishi', 'Lexus', 'Infiniti', 'Land Rover', 'Jeep', 'Audi', 'Volkswagen']

function parseTranscript(transcript) {
  const text = transcript.trim()
  const fields = {}

  // phone: +971... or 05...
  const phoneMatch = text.match(/(\+971\s?\d[\d\s]{7,10}|05\d[\d\s]{7,9})/)
  if (phoneMatch) {
    fields.customerPhone = phoneMatch[0].replace(/\s/g, '')
    if (fields.customerPhone.startsWith('05')) {
      fields.customerPhone = '+971' + fields.customerPhone.slice(1)
    }
  }

  // email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  if (emailMatch) fields.customerEmail = emailMatch[0]

  // year: 4-digit starting with 19 or 20
  const yearMatch = text.match(/\b(19|20)\d{2}\b/)
  if (yearMatch) fields.vehicleYear = yearMatch[0]

  // plate: letters + numbers pattern
  const plateMatch = text.match(/\b([A-Za-z]{1,3}\s?\d{3,6}|\d{3,6}\s?[A-Za-z]{1,3})\b/)
  if (plateMatch) fields.licensePlate = plateMatch[0].toUpperCase()

  // vehicle make
  const lower = text.toLowerCase()
  const foundMake = MAKES.find(m => lower.includes(m.toLowerCase()))
  if (foundMake) {
    fields.vehicleMake = foundMake
    // model: word(s) immediately after make name
    const afterMake = text.slice(lower.indexOf(foundMake.toLowerCase()) + foundMake.length).trim()
    const modelTokens = []
    for (const word of afterMake.split(/\s+/)) {
      if (/^\d{4}$/.test(word)) break // stop at year
      if (/^[A-Za-z0-9-]+$/.test(word) && word.length > 1) modelTokens.push(word)
      if (modelTokens.length >= 2) break
    }
    if (modelTokens.length) fields.vehicleModel = modelTokens.join(' ')
  }

  // customer name: longest contiguous alpha sequence before any keyword
  const keywordIdx = Math.min(
    ...[
      phoneMatch ? text.toLowerCase().indexOf(phoneMatch[0].toLowerCase()) : Infinity,
      emailMatch ? text.toLowerCase().indexOf(emailMatch[0].toLowerCase()) : Infinity,
      foundMake ? lower.indexOf(foundMake.toLowerCase()) : Infinity,
      yearMatch ? lower.indexOf(yearMatch[0]) : Infinity,
    ].filter(i => i >= 0 && i < Infinity)
  )
  if (keywordIdx > 0) {
    const namePart = text.slice(0, keywordIdx).replace(/^(customer|name|hi|hello|the)\s*/i, '').trim()
    if (namePart.length > 1) fields.customerName = namePart.replace(/[,.]$/, '').trim()
  }

  return fields
}

export default function VoiceInputButton({ onResult }) {
  const [listening, setListening] = useState(false)
  const [unsupported, setUnsupported] = useState(false)
  const recognitionRef = useRef(null)

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

  if (!SpeechRecognition && !unsupported) {
    setUnsupported(true)
  }

  const toggle = () => {
    if (unsupported) return

    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    const rec = new SpeechRecognition()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = 'en-US'

    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)

    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript || ''
      if (transcript) {
        const fields = parseTranscript(transcript)
        if (Object.keys(fields).length > 0) onResult(fields)
      }
    }

    recognitionRef.current = rec
    rec.start()
  }

  return (
    <button
      type="button"
      className="icon-btn"
      title={unsupported ? 'Voice input not supported in this browser' : listening ? 'Listening… tap to stop' : 'Fill form by voice'}
      onClick={toggle}
      disabled={unsupported}
      style={{
        opacity: unsupported ? 0.4 : 1,
        color: listening ? 'var(--destructive, #ef4444)' : undefined,
        animation: listening ? 'pulse 1s infinite' : undefined,
      }}
    >
      {listening ? <MicOff size={16} /> : <Mic size={16} />}
    </button>
  )
}
