import { renderToStaticMarkup } from 'react-dom/server'

// ── Helpers ────────────────────────────────────────────────
function fmtAED(n) {
  return 'AED ' + Number(n || 0).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtDate(iso) {
  if (!iso) return new Date().toLocaleDateString('en-AE', { day: '2-digit', month: 'long', year: 'numeric' })
  return new Date(iso).toLocaleDateString('en-AE', { day: '2-digit', month: 'long', year: 'numeric' })
}

// ── Logo slot ──────────────────────────────────────────────
function LogoSlot({ logoDataUrl, companyName, style = {} }) {
  if (logoDataUrl) {
    return <img src={logoDataUrl} alt="logo" style={{ maxHeight: 60, maxWidth: 160, objectFit: 'contain', ...style }} />
  }
  return <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', ...style }}>{companyName}</span>
}

// ══════════════════════════════════════════════════════════
// TEMPLATE 1 — Classic
// ══════════════════════════════════════════════════════════
function ClassicTemplate({ invoice, job, jobServices, jobParts, companyInfo, logoDataUrl }) {
  const serviceTotal = jobServices.reduce((s, l) => s + Number(l.service_cost), 0)
  const partsTotal = jobParts.reduce((s, l) => s + Number(l.part_cost) * l.quantity, 0)
  const grandTotal = invoice?.total_amount ?? (serviceTotal + partsTotal)
  const isPaid = invoice?.status === 'paid'

  return (
    <div style={{ fontFamily: 'Georgia, serif', color: '#1a1a1a', maxWidth: 720, margin: '0 auto', padding: '48px 40px', background: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 20, borderBottom: '2px solid #1a1a1a', marginBottom: 28 }}>
        <div>
          <LogoSlot logoDataUrl={logoDataUrl} companyName={companyInfo.companyName} />
          <div style={{ marginTop: 8, fontSize: 12, color: '#555', lineHeight: 1.7 }}>
            <div>{companyInfo.companyEmail}</div>
            <div>{companyInfo.companyPhone}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px' }}>INVOICE</div>
          <div style={{ fontSize: 14, color: '#555', marginTop: 4 }}>{invoice?.invoice_number || 'DRAFT'}</div>
          <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>Date: {fmtDate(invoice?.created_at)}</div>
          {isPaid && (
            <div style={{ marginTop: 8, display: 'inline-block', border: '2px solid #16a34a', color: '#16a34a', padding: '2px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>PAID</div>
          )}
        </div>
      </div>

      {/* Bill To */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#888', textTransform: 'uppercase', marginBottom: 6 }}>Bill To</div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{job.customers?.name}</div>
        <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{job.customers?.phone}</div>
        <div style={{ fontSize: 12, color: '#555' }}>{job.vehicles?.make} {job.vehicles?.model} {job.vehicles?.year} · {job.vehicles?.license_plate}</div>
      </div>

      {/* Line items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 24 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
            <th style={{ textAlign: 'left', paddingBottom: 8, fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#555' }}>Description</th>
            <th style={{ textAlign: 'right', paddingBottom: 8, fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#555' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {jobServices.map((l, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px 0', color: '#333' }}>{l.service_name}</td>
              <td style={{ padding: '10px 0', textAlign: 'right', color: '#333' }}>{fmtAED(l.service_cost)}</td>
            </tr>
          ))}
          {jobParts.map((l, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px 0', color: '#333' }}>{l.part_name} <span style={{ color: '#999', fontSize: 11 }}>×{l.quantity}</span></td>
              <td style={{ padding: '10px 0', textAlign: 'right', color: '#333' }}>{fmtAED(Number(l.part_cost) * l.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Subtotals */}
      <div style={{ borderTop: '1px solid #ccc', paddingTop: 12, marginBottom: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 4 }}>
          <span>Services subtotal</span><span>{fmtAED(serviceTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 10 }}>
          <span>Parts subtotal</span><span>{fmtAED(partsTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #1a1a1a', paddingTop: 10, fontSize: 18, fontWeight: 900 }}>
          <span>Total</span><span>{fmtAED(grandTotal)}</span>
        </div>
      </div>

      {/* Footer */}
      {companyInfo.footerText && (
        <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid #eee', fontSize: 10, color: '#999', lineHeight: 1.6 }}>
          {companyInfo.footerText}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// TEMPLATE 2 — Modern
// ══════════════════════════════════════════════════════════
function ModernTemplate({ invoice, job, jobServices, jobParts, companyInfo, logoDataUrl }) {
  const serviceTotal = jobServices.reduce((s, l) => s + Number(l.service_cost), 0)
  const partsTotal = jobParts.reduce((s, l) => s + Number(l.part_cost) * l.quantity, 0)
  const grandTotal = invoice?.total_amount ?? (serviceTotal + partsTotal)
  const isPaid = invoice?.status === 'paid'
  const CRIMSON = '#c0392b'

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#1a1a1a', maxWidth: 720, margin: '0 auto', background: '#fff' }}>
      {/* Crimson header */}
      <div style={{ background: CRIMSON, padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <LogoSlot logoDataUrl={logoDataUrl} companyName={companyInfo.companyName} style={{ color: '#fff', filter: logoDataUrl ? 'brightness(0) invert(1)' : undefined }} />
        <div style={{ textAlign: 'right', color: '#fff' }}>
          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 2 }}>Invoice</div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>{invoice?.invoice_number || 'DRAFT'}</div>
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{fmtDate(invoice?.created_at)}</div>
        </div>
      </div>

      <div style={{ padding: '36px 40px' }}>
        {/* Meta row */}
        <div style={{ display: 'flex', gap: 32, marginBottom: 32 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: CRIMSON, textTransform: 'uppercase', marginBottom: 6 }}>Client</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{job.customers?.name}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{job.customers?.phone}</div>
            {job.customers?.email && <div style={{ fontSize: 12, color: '#666' }}>{job.customers.email}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: CRIMSON, textTransform: 'uppercase', marginBottom: 6 }}>Vehicle</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{job.vehicles?.make} {job.vehicles?.model}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{job.vehicles?.year} · {job.vehicles?.license_plate}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: CRIMSON, textTransform: 'uppercase', marginBottom: 6 }}>Status</div>
            <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: isPaid ? '#dcfce7' : '#fef3c7', color: isPaid ? '#16a34a' : '#92400e', fontSize: 12, fontWeight: 700 }}>
              {isPaid ? 'Paid' : 'Awaiting Payment'}
            </div>
          </div>
        </div>

        {/* Line items */}
        <div style={{ background: '#f9f9f9', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', background: '#f0f0f0', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#555' }}>
            <span>Item</span><span>Amount</span>
          </div>
          {jobServices.map((l, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #eaeaea', fontSize: 13 }}>
              <span>{l.service_name}</span>
              <span style={{ fontWeight: 600 }}>{fmtAED(l.service_cost)}</span>
            </div>
          ))}
          {jobParts.map((l, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #eaeaea', fontSize: 13 }}>
              <span>{l.part_name} <span style={{ color: '#999', fontSize: 11 }}>×{l.quantity}</span></span>
              <span style={{ fontWeight: 600 }}>{fmtAED(Number(l.part_cost) * l.quantity)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ textAlign: 'right', marginBottom: 32 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>Services {fmtAED(serviceTotal)} · Parts {fmtAED(partsTotal)}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, background: CRIMSON, color: '#fff', padding: '14px 24px', borderRadius: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.85 }}>TOTAL</span>
            <span style={{ fontSize: 22, fontWeight: 900 }}>{fmtAED(grandTotal)}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ paddingTop: 16, borderTop: '1px solid #eee', fontSize: 10, color: '#aaa', lineHeight: 1.6 }}>
          <span>{companyInfo.companyEmail} · {companyInfo.companyPhone}</span>
          {companyInfo.footerText && <div style={{ marginTop: 6 }}>{companyInfo.footerText}</div>}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// TEMPLATE 3 — Minimal
// ══════════════════════════════════════════════════════════
function MinimalTemplate({ invoice, job, jobServices, jobParts, companyInfo, logoDataUrl }) {
  const serviceTotal = jobServices.reduce((s, l) => s + Number(l.service_cost), 0)
  const partsTotal = jobParts.reduce((s, l) => s + Number(l.part_cost) * l.quantity, 0)
  const grandTotal = invoice?.total_amount ?? (serviceTotal + partsTotal)
  const isPaid = invoice?.status === 'paid'

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#111', maxWidth: 680, margin: '0 auto', padding: '60px 48px', background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 52 }}>
        <LogoSlot logoDataUrl={logoDataUrl} companyName={companyInfo.companyName} style={{ fontSize: 18, fontWeight: 800 }} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#999', letterSpacing: 2, textTransform: 'uppercase' }}>Invoice</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{invoice?.invoice_number || 'DRAFT'}</div>
          <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>{fmtDate(invoice?.created_at)}</div>
        </div>
      </div>

      {/* Client */}
      <div style={{ marginBottom: 44 }}>
        <div style={{ fontSize: 10, color: '#bbb', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Billed to</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{job.customers?.name}</div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 3 }}>{job.customers?.phone} · {job.vehicles?.make} {job.vehicles?.model} {job.vehicles?.license_plate}</div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #f0f0f0', marginBottom: 20 }} />

      {/* Items */}
      {jobServices.map((l, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #f5f5f5', fontSize: 14 }}>
          <span>{l.service_name}</span>
          <span style={{ color: '#555' }}>{fmtAED(l.service_cost)}</span>
        </div>
      ))}
      {jobParts.map((l, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #f5f5f5', fontSize: 14 }}>
          <span>{l.part_name} <span style={{ color: '#ccc', fontSize: 11 }}>×{l.quantity}</span></span>
          <span style={{ color: '#555' }}>{fmtAED(Number(l.part_cost) * l.quantity)}</span>
        </div>
      ))}

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '2px solid #111', fontSize: 18, fontWeight: 800 }}>
        <span>Total</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isPaid && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#16a34a', textTransform: 'uppercase', border: '1px solid #16a34a', padding: '2px 8px', borderRadius: 3 }}>Paid</span>}
          <span>{fmtAED(grandTotal)}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 64, fontSize: 10, color: '#ccc', lineHeight: 1.8 }}>
        <div>{companyInfo.companyName} · {companyInfo.companyEmail} · {companyInfo.companyPhone}</div>
        {companyInfo.footerText && <div>{companyInfo.footerText}</div>}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// TEMPLATE 4 — Professional
// ══════════════════════════════════════════════════════════
function ProfessionalTemplate({ invoice, job, jobServices, jobParts, companyInfo, logoDataUrl }) {
  const serviceTotal = jobServices.reduce((s, l) => s + Number(l.service_cost), 0)
  const partsTotal = jobParts.reduce((s, l) => s + Number(l.part_cost) * l.quantity, 0)
  const grandTotal = invoice?.total_amount ?? (serviceTotal + partsTotal)
  const isPaid = invoice?.status === 'paid'

  return (
    <div style={{ fontFamily: '"Segoe UI", Arial, sans-serif', color: '#1e293b', maxWidth: 760, margin: '0 auto', padding: '40px', background: '#fff' }}>
      {/* Two-column header */}
      <table style={{ width: '100%', marginBottom: 24, borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'top', paddingRight: 20 }}>
              <LogoSlot logoDataUrl={logoDataUrl} companyName={companyInfo.companyName} style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }} />
              <div style={{ marginTop: 10, fontSize: 11, color: '#64748b', lineHeight: 1.8 }}>
                <div>{companyInfo.companyEmail}</div>
                <div>{companyInfo.companyPhone}</div>
              </div>
            </td>
            <td style={{ verticalAlign: 'top', textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#1e40af', letterSpacing: -1 }}>INVOICE</div>
              <table style={{ marginLeft: 'auto', borderCollapse: 'collapse', marginTop: 8 }}>
                <tbody>
                  {[
                    ['Invoice No', invoice?.invoice_number || 'DRAFT'],
                    ['Date', fmtDate(invoice?.created_at)],
                    ['Job No', job.job_number],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', paddingRight: 10, paddingBottom: 3, whiteSpace: 'nowrap' }}>{k}:</td>
                      <td style={{ fontSize: 12, fontWeight: 600, textAlign: 'right', paddingBottom: 3 }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Bill To */}
      <div style={{ background: '#f1f5f9', borderLeft: '4px solid #1e40af', padding: '14px 18px', marginBottom: 24, borderRadius: '0 6px 6px 0' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#1e40af', textTransform: 'uppercase', marginBottom: 6 }}>Bill To</div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{job.customers?.name}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
          {job.customers?.phone}
          {job.customers?.email && ` · ${job.customers.email}`}
        </div>
        <div style={{ fontSize: 12, color: '#64748b' }}>
          {job.vehicles?.make} {job.vehicles?.model} {job.vehicles?.year} · Plate: {job.vehicles?.license_plate}
        </div>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 0 }}>
        <thead>
          <tr style={{ background: '#1e293b', color: '#fff' }}>
            <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>Description</th>
            <th style={{ textAlign: 'center', padding: '10px 14px', fontWeight: 600, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', width: 60 }}>Qty</th>
            <th style={{ textAlign: 'right', padding: '10px 14px', fontWeight: 600, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', width: 130 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {jobServices.map((l, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '11px 14px' }}>{l.service_name}</td>
              <td style={{ padding: '11px 14px', textAlign: 'center', color: '#94a3b8' }}>—</td>
              <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 600 }}>{fmtAED(l.service_cost)}</td>
            </tr>
          ))}
          {jobParts.map((l, i) => (
            <tr key={i} style={{ background: (jobServices.length + i) % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '11px 14px' }}>{l.part_name}</td>
              <td style={{ padding: '11px 14px', textAlign: 'center', color: '#64748b' }}>{l.quantity}</td>
              <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 600 }}>{fmtAED(Number(l.part_cost) * l.quantity)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '1px solid #cbd5e1' }}>
            <td style={{ padding: '8px 14px', fontSize: 12, color: '#94a3b8' }} colSpan={2}>Services subtotal</td>
            <td style={{ padding: '8px 14px', textAlign: 'right', fontSize: 12, color: '#64748b' }}>{fmtAED(serviceTotal)}</td>
          </tr>
          <tr>
            <td style={{ padding: '4px 14px 12px', fontSize: 12, color: '#94a3b8' }} colSpan={2}>Parts subtotal</td>
            <td style={{ padding: '4px 14px 12px', textAlign: 'right', fontSize: 12, color: '#64748b' }}>{fmtAED(partsTotal)}</td>
          </tr>
          <tr style={{ background: '#1e40af' }}>
            <td style={{ padding: '14px', color: '#fff', fontWeight: 800, fontSize: 15 }} colSpan={2}>
              TOTAL AMOUNT DUE
              {isPaid && <span style={{ marginLeft: 12, background: '#fff', color: '#1e40af', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 3, letterSpacing: 1 }}>✓ PAID</span>}
            </td>
            <td style={{ padding: '14px', textAlign: 'right', color: '#fff', fontWeight: 900, fontSize: 20 }}>{fmtAED(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Footer */}
      {companyInfo.footerText && (
        <div style={{ marginTop: 24, fontSize: 10, color: '#94a3b8', lineHeight: 1.7, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
          {companyInfo.footerText}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// Public component — pick template by ID
// ══════════════════════════════════════════════════════════
export default function InvoicePrintTemplate(props) {
  const { templateId = 'classic' } = props
  switch (templateId) {
    case 'modern':       return <ModernTemplate {...props} />
    case 'minimal':      return <MinimalTemplate {...props} />
    case 'professional': return <ProfessionalTemplate {...props} />
    default:             return <ClassicTemplate {...props} />
  }
}

// ── Utility: render template to HTML string for print/email ─
const DEFAULT_COMPANY = { companyName: 'Pitstop Garage', companyPhone: '', companyEmail: '', footerText: '' }

export function renderInvoiceToHtml({ invoice, job, jobServices, jobParts, templateId, logoDataUrl }) {
  const companyInfo = (() => {
    try { return JSON.parse(localStorage.getItem('pitstop_template') || '{}') } catch { return {} }
  })()
  const merged = { ...DEFAULT_COMPANY, ...companyInfo }

  const body = renderToStaticMarkup(
    <InvoicePrintTemplate
      invoice={invoice}
      job={job}
      jobServices={jobServices}
      jobParts={jobParts}
      companyInfo={merged}
      templateId={templateId}
      logoDataUrl={logoDataUrl}
    />
  )

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${invoice?.invoice_number || ''}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #fff; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { margin: 0; }
  }
</style></head><body>${body}</body></html>`
}
