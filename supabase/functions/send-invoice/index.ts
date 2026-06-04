import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// +971501294250 | 971501294250 | 0501294250 | 501294250  →  971501294250
function normaliseToE164(phone: string): string | null {
  let d = (phone || '').replace(/\D/g, '')
  if (!d) return null
  if (d.startsWith('0')) d = '971' + d.slice(1)
  if (d.length === 9) d = '971' + d
  return d
}

async function sendWhatsApp(
  phone: string,
  pdfBase64: string,
  filename: string,
  caption: string,
): Promise<void> {
  const url = Deno.env.get('WHATSAPP_SERVER_URL')
  const secret = Deno.env.get('WHATSAPP_API_SECRET')
  if (!url || !secret) return

  const e164 = normaliseToE164(phone)
  if (!e164) return

  await fetch(`${url}/send-document`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone: e164, pdfBase64, filename, caption }),
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, invoiceHtml, invoiceNumber, totalAmount, customerName, pdfBase64, customerPhone } = await req.json()

    if (!to || !invoiceHtml) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const formattedTotal = new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
    }).format(Number(totalAmount || 0))

    // Fire email + WhatsApp in parallel
    const emailPromise = fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Pitstop Garage <onboarding@resend.dev>',
        to: [to],
        subject: `Your Invoice ${invoiceNumber} from Pitstop Garage — ${formattedTotal}`,
        html: invoiceHtml,
        ...(pdfBase64 ? {
          attachments: [{
            filename: `Invoice-${invoiceNumber}.pdf`,
            content: pdfBase64,
          }],
        } : {}),
      }),
    })

    const waPromise = (customerPhone && pdfBase64)
      ? sendWhatsApp(
          customerPhone,
          pdfBase64,
          `Invoice-${invoiceNumber}.pdf`,
          `Hi ${customerName || 'there'}, please find your invoice ${invoiceNumber} from Pitstop Garage attached (${formattedTotal}).`,
        ).catch(() => {})
      : Promise.resolve()

    const [res] = await Promise.all([emailPromise, waPromise])
    const data = await res.json()

    if (!res.ok) {
      return new Response(JSON.stringify({ error: data }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
