import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PLATE_MOCK = {
  licensePlate: 'A 12345',
  vehicleMake: 'Toyota',
  vehicleModel: 'Camry',
  vehicleYear: '2022',
}

const CARD_MOCK = {
  customerName: 'Ahmed Al Mansoori',
  customerPhone: '+971501234567',
  customerEmail: 'ahmed@example.com',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageBase64, mimeType, scanType } = await req.json()

    if (!imageBase64 || !scanType) {
      return new Response(JSON.stringify({ error: 'imageBase64 and scanType are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')

    // Demo mode: no API key configured — return mock data
    if (!apiKey) {
      await new Promise(r => setTimeout(r, 1200)) // simulate processing delay
      const mock = scanType === 'plate' ? PLATE_MOCK : CARD_MOCK
      return new Response(JSON.stringify({ success: true, data: mock, demo: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const prompt = scanType === 'plate'
      ? `Look at this image of a vehicle license plate. Extract the information and return ONLY a JSON object with these fields:
{
  "licensePlate": "the plate number exactly as shown",
  "vehicleMake": "car brand if visible in image or null",
  "vehicleModel": "car model if visible or null",
  "vehicleYear": "year as string if visible or null"
}
Return only the JSON, no other text.`
      : `Look at this business card image. Extract the contact information and return ONLY a JSON object with these fields:
{
  "customerName": "full name on the card",
  "customerPhone": "phone number, prefer mobile, in +971 format if UAE",
  "customerEmail": "email address or null"
}
Return only the JSON, no other text.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType || 'image/jpeg',
                  data: imageBase64,
                },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return new Response(JSON.stringify({ error: 'Claude API error', detail: err }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = await response.json()
    const text = result.content?.[0]?.text || '{}'

    let data
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      data = JSON.parse(jsonMatch ? jsonMatch[0] : text)
    } catch {
      data = {}
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
