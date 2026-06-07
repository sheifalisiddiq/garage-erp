import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ImageScanButton({ scanType, onResult, title }) {
  const inputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleCapture = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setLoading(true)

    try {
      const base64 = await fileToBase64(file)
      const { data, error: fnError } = await supabase.functions.invoke('scan-image', {
        body: { imageBase64: base64, mimeType: file.type, scanType },
      })

      if (fnError) throw new Error(fnError.message)
      if (data?.data) onResult(data.data)
    } catch (err) {
      setError('Scan failed. Try again.')
    } finally {
      setLoading(false)
      // clear input so same image can be retaken
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleCapture}
      />
      <button
        type="button"
        className="icon-btn"
        title={title || (scanType === 'plate' ? 'Scan license plate' : 'Scan business card')}
        onClick={() => !loading && inputRef.current?.click()}
        style={{ opacity: loading ? 0.6 : 1 }}
      >
        {loading
          ? <Loader2 size={16} className="spin" />
          : <Camera size={16} />
        }
      </button>
      {error && (
        <span style={{ fontSize: 10, color: 'var(--destructive)', whiteSpace: 'nowrap' }}>
          {error}
        </span>
      )}
    </div>
  )
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      // strip data URL prefix, keep only base64 content
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
