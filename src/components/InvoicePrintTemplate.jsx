import { renderToStaticMarkup } from 'react-dom/server'
import { calculateLineVat, calculateInvoiceTotals, groupTaxByCategory, vatCategoryLabel, vatRateLabel } from '../lib/utils'

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

// ── Normalize line items for UAE mandatory fields ──────────
function buildLines(jobServices, jobParts) {
  return [
    ...jobServices.map((s, i) => {
      const vatRate = s.vat_rate ?? 0
      const { vatAmount, lineTotal } = calculateLineVat(Number(s.service_cost), vatRate)
      return {
        num: i + 1,
        description: s.service_name,
        unit: s.unit_code || 'HUR',
        qty: 1,
        unitPrice: Number(s.service_cost),
        netAmount: Number(s.service_cost),
        vatRate,
        vatAmount,
        lineTotal,
      }
    }),
    ...jobParts.map((p, i) => {
      const vatRate = p.vat_rate ?? 0
      const net = Number(p.part_cost) * p.quantity
      const { vatAmount, lineTotal } = calculateLineVat(net, vatRate)
      return {
        num: jobServices.length + i + 1,
        description: `${p.part_name}`,
        unit: p.unit_code || 'EA',
        qty: p.quantity,
        unitPrice: Number(p.part_cost),
        netAmount: net,
        vatRate,
        vatAmount,
        lineTotal,
      }
    }),
  ]
}

// ── Tax breakdown table (shared across all templates) ──────
function TaxBreakdown({ services, parts, labelStyle, rowStyle, borderColor }) {
  const cats = groupTaxByCategory(services, parts)
  if (cats.length === 0) return null
  const border = borderColor || '#e2e8f0'
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginTop: 12 }}>
      <thead>
        <tr style={{ background: '#f8fafc' }}>
          <th style={{ textAlign: 'left', padding: '5px 8px', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#94a3b8', borderBottom: `1px solid ${border}`, ...labelStyle }}>Tax Category</th>
          <th style={{ textAlign: 'right', padding: '5px 8px', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#94a3b8', borderBottom: `1px solid ${border}`, ...labelStyle }}>Taxable Amt</th>
          <th style={{ textAlign: 'right', padding: '5px 8px', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#94a3b8', borderBottom: `1px solid ${border}`, ...labelStyle }}>Rate</th>
          <th style={{ textAlign: 'right', padding: '5px 8px', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#94a3b8', borderBottom: `1px solid ${border}`, ...labelStyle }}>Tax Amt (AED)</th>
        </tr>
      </thead>
      <tbody>
        {cats.map(c => (
          <tr key={c.category} style={rowStyle}>
            <td style={{ padding: '4px 8px', color: '#555', borderBottom: `1px solid ${border}` }}>{vatCategoryLabel(c.category)}</td>
            <td style={{ padding: '4px 8px', textAlign: 'right', color: '#555', borderBottom: `1px solid ${border}` }}>{fmtAED(c.taxableAmt)}</td>
            <td style={{ padding: '4px 8px', textAlign: 'right', color: '#555', borderBottom: `1px solid ${border}` }}>{c.rate === null ? 'Exempt' : `${c.rate}%`}</td>
            <td style={{ padding: '4px 8px', textAlign: 'right', color: '#555', borderBottom: `1px solid ${border}` }}>{fmtAED(c.taxAmt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Transaction flag badges ────────────────────────────────
function TxnFlags({ invoice, accent }) {
  const flags = [
    invoice?.is_free_trade_zone && 'Free Trade Zone',
    invoice?.is_deemed_supply && 'Deemed Supply',
    invoice?.is_margin_scheme && 'Margin Scheme',
    invoice?.is_e_commerce && 'E-Commerce',
    invoice?.is_export && 'Export',
  ].filter(Boolean)
  if (flags.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
      {flags.map(f => (
        <span key={f} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, padding: '2px 6px', borderRadius: 3, background: accent || '#e0f2fe', color: accent ? '#fff' : '#0369a1' }}>{f.toUpperCase()}</span>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// TEMPLATE 1 — Classic
// ══════════════════════════════════════════════════════════
function ClassicTemplate({ invoice, job, jobServices, jobParts, companyInfo, logoDataUrl, einvoicingSettings: ei = {} }) {
  const lines = buildLines(jobServices, jobParts)
  const { netAmount, taxTotal, payableAmount } = invoice?.net_amount != null
    ? { netAmount: invoice.net_amount, taxTotal: invoice.tax_total, payableAmount: invoice.payable_amount ?? invoice.total_amount }
    : calculateInvoiceTotals(jobServices, jobParts)
  const isPaid = invoice?.status === 'paid'

  return (
    <div style={{ fontFamily: 'Georgia, serif', color: '#1a1a1a', maxWidth: 720, margin: '0 auto', padding: '48px 40px', background: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 20, borderBottom: '2px solid #1a1a1a', marginBottom: 28 }}>
        <div>
          <LogoSlot logoDataUrl={logoDataUrl} companyName={companyInfo.companyName} />
          <div style={{ marginTop: 8, fontSize: 11, color: '#555', lineHeight: 1.8 }}>
            {ei.tin && <div style={{ fontWeight: 700 }}>TIN: {ei.tin}</div>}
            {ei.legalRegNumber && <div>{ei.legalRegType}: {ei.legalRegNumber}</div>}
            {ei.sellerStreet && <div>{ei.sellerStreet}{ei.sellerCity ? `, ${ei.sellerCity}` : ''}{ei.sellerCountry ? `, ${ei.sellerCountry}` : ''}{ei.sellerPostalCode ? ` ${ei.sellerPostalCode}` : ''}</div>}
            {ei.tin && <div style={{ color: '#888', fontSize: 10 }}>Endpoint: 0235{ei.tin}</div>}
            <div>{companyInfo.companyEmail}</div>
            <div>{companyInfo.companyPhone}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px' }}>INVOICE</div>
          <div style={{ fontSize: 14, color: '#555', marginTop: 4 }}>{invoice?.invoice_number || 'DRAFT'}</div>
          <div style={{ fontSize: 11, color: '#777', marginTop: 2 }}>Date: {fmtDate(invoice?.created_at)}</div>
          {invoice?.due_date && <div style={{ fontSize: 11, color: '#777', marginTop: 1 }}>Due: {fmtDate(invoice.due_date)}</div>}
          <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>Type: Commercial Invoice · {invoice?.currency_code || 'AED'}</div>
          {isPaid && (
            <div style={{ marginTop: 8, display: 'inline-block', border: '2px solid #16a34a', color: '#16a34a', padding: '2px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>PAID</div>
          )}
          <TxnFlags invoice={invoice} />
        </div>
      </div>

      {/* Bill To */}
      <div style={{ display: 'flex', gap: 40, marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#888', textTransform: 'uppercase', marginBottom: 6 }}>Bill To</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{job.customers?.name}</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{job.customers?.phone}</div>
          <div style={{ fontSize: 12, color: '#555' }}>{job.customers?.email}</div>
          {invoice?.buyer_is_business && invoice?.buyer_legal_id_number && (
            <div style={{ fontSize: 11, color: '#777', marginTop: 4 }}>
              <div>{invoice.buyer_legal_id_type}: {invoice.buyer_legal_id_number}</div>
              {invoice.buyer_street && <div>{invoice.buyer_street}{invoice.buyer_city ? `, ${invoice.buyer_city}` : ''}{invoice.buyer_country ? `, ${invoice.buyer_country}` : ''}{invoice.buyer_postal_code ? ` ${invoice.buyer_postal_code}` : ''}</div>}
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#888', textTransform: 'uppercase', marginBottom: 6 }}>Vehicle</div>
          <div style={{ fontSize: 13 }}>{job.vehicles?.make} {job.vehicles?.model} {job.vehicles?.year}</div>
          <div style={{ fontSize: 12, color: '#555' }}>{job.vehicles?.license_plate}</div>
        </div>
      </div>

      {/* Line items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
            <th style={{ textAlign: 'left', paddingBottom: 7, fontWeight: 700, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#555', width: 24 }}>#</th>
            <th style={{ textAlign: 'left', paddingBottom: 7, fontWeight: 700, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#555' }}>Description</th>
            <th style={{ textAlign: 'center', paddingBottom: 7, fontWeight: 700, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#555', width: 40 }}>Unit</th>
            <th style={{ textAlign: 'center', paddingBottom: 7, fontWeight: 700, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#555', width: 40 }}>Qty</th>
            <th style={{ textAlign: 'right', paddingBottom: 7, fontWeight: 700, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#555', width: 90 }}>Unit Price</th>
            <th style={{ textAlign: 'right', paddingBottom: 7, fontWeight: 700, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#555', width: 60 }}>VAT %</th>
            <th style={{ textAlign: 'right', paddingBottom: 7, fontWeight: 700, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#555', width: 90 }}>VAT (AED)</th>
            <th style={{ textAlign: 'right', paddingBottom: 7, fontWeight: 700, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#555', width: 100 }}>Total (AED)</th>
          </tr>
        </thead>
        <tbody>
          {lines.map(l => (
            <tr key={l.num} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px 0', color: '#999', fontSize: 11 }}>{l.num}</td>
              <td style={{ padding: '8px 0', color: '#333' }}>{l.description}</td>
              <td style={{ padding: '8px 0', textAlign: 'center', color: '#777', fontSize: 10 }}>{l.unit}</td>
              <td style={{ padding: '8px 0', textAlign: 'center', color: '#333' }}>{l.qty}</td>
              <td style={{ padding: '8px 0', textAlign: 'right', color: '#333' }}>{fmtAED(l.unitPrice)}</td>
              <td style={{ padding: '8px 0', textAlign: 'right', color: '#777', fontSize: 11 }}>{vatRateLabel(l.vatRate)}</td>
              <td style={{ padding: '8px 0', textAlign: 'right', color: '#777' }}>{fmtAED(l.vatAmount)}</td>
              <td style={{ padding: '8px 0', textAlign: 'right', color: '#333', fontWeight: 600 }}>{fmtAED(l.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ borderTop: '1px solid #ccc', paddingTop: 12, marginBottom: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 3 }}>
          <span>Net Amount (excl. VAT)</span><span>{fmtAED(netAmount)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 10 }}>
          <span>Total VAT</span><span>{fmtAED(taxTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #1a1a1a', paddingTop: 10, fontSize: 18, fontWeight: 900 }}>
          <span>Total Amount Due</span><span>{fmtAED(payableAmount)}</span>
        </div>
      </div>

      {/* Tax breakdown */}
      <TaxBreakdown services={jobServices} parts={jobParts} />

      {/* Footer */}
      {companyInfo.footerText && (
        <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #eee', fontSize: 10, color: '#999', lineHeight: 1.6 }}>
          {companyInfo.footerText}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// TEMPLATE 2 — Modern
// ══════════════════════════════════════════════════════════
function ModernTemplate({ invoice, job, jobServices, jobParts, companyInfo, logoDataUrl, einvoicingSettings: ei = {} }) {
  const lines = buildLines(jobServices, jobParts)
  const { netAmount, taxTotal, payableAmount } = invoice?.net_amount != null
    ? { netAmount: invoice.net_amount, taxTotal: invoice.tax_total, payableAmount: invoice.payable_amount ?? invoice.total_amount }
    : calculateInvoiceTotals(jobServices, jobParts)
  const isPaid = invoice?.status === 'paid'
  const CRIMSON = '#c0392b'

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#1a1a1a', maxWidth: 720, margin: '0 auto', background: '#fff' }}>
      {/* Crimson header */}
      <div style={{ background: CRIMSON, padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <LogoSlot logoDataUrl={logoDataUrl} companyName={companyInfo.companyName} style={{ color: '#fff', filter: logoDataUrl ? 'brightness(0) invert(1)' : undefined }} />
          <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
            {ei.tin && <div>TIN: {ei.tin}</div>}
            {ei.legalRegNumber && <div>{ei.legalRegType}: {ei.legalRegNumber}</div>}
            {ei.sellerStreet && <div>{ei.sellerStreet}{ei.sellerCity ? `, ${ei.sellerCity}` : ''}</div>}
            {ei.tin && <div style={{ fontSize: 9 }}>Endpoint: 0235{ei.tin}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'right', color: '#fff' }}>
          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 2 }}>Invoice</div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>{invoice?.invoice_number || 'DRAFT'}</div>
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{fmtDate(invoice?.created_at)}</div>
          {invoice?.due_date && <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2 }}>Due: {fmtDate(invoice.due_date)}</div>}
          <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2 }}>Commercial Invoice · {invoice?.currency_code || 'AED'}</div>
          <TxnFlags invoice={invoice} accent={CRIMSON} />
        </div>
      </div>

      <div style={{ padding: '36px 40px' }}>
        {/* Meta row */}
        <div style={{ display: 'flex', gap: 32, marginBottom: 28 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: CRIMSON, textTransform: 'uppercase', marginBottom: 6 }}>Client</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{job.customers?.name}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{job.customers?.phone}</div>
            {job.customers?.email && <div style={{ fontSize: 12, color: '#666' }}>{job.customers.email}</div>}
            {invoice?.buyer_is_business && invoice?.buyer_legal_id_number && (
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                <div>{invoice.buyer_legal_id_type}: {invoice.buyer_legal_id_number}</div>
                {invoice.buyer_street && <div>{invoice.buyer_street}{invoice.buyer_city ? `, ${invoice.buyer_city}` : ''}</div>}
              </div>
            )}
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
          <div style={{ display: 'flex', padding: '8px 16px', background: '#f0f0f0', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#666' }}>
            <span style={{ width: 20 }}>#</span>
            <span style={{ flex: 1 }}>Item</span>
            <span style={{ width: 36, textAlign: 'center' }}>Qty</span>
            <span style={{ width: 90, textAlign: 'right' }}>Unit Price</span>
            <span style={{ width: 52, textAlign: 'right' }}>VAT%</span>
            <span style={{ width: 80, textAlign: 'right' }}>VAT</span>
            <span style={{ width: 90, textAlign: 'right' }}>Total</span>
          </div>
          {lines.map((l, i) => (
            <div key={l.num} style={{ display: 'flex', padding: '10px 16px', borderBottom: '1px solid #eaeaea', fontSize: 12, background: i % 2 === 0 ? '#fff' : '#fafafa', alignItems: 'center' }}>
              <span style={{ width: 20, color: '#bbb', fontSize: 10 }}>{l.num}</span>
              <span style={{ flex: 1 }}>{l.description} {l.qty > 1 && <span style={{ color: '#999', fontSize: 10 }}>×{l.qty}</span>}</span>
              <span style={{ width: 36, textAlign: 'center', color: '#888', fontSize: 10 }}>{l.unit}</span>
              <span style={{ width: 90, textAlign: 'right', fontWeight: 600 }}>{fmtAED(l.unitPrice)}</span>
              <span style={{ width: 52, textAlign: 'right', color: '#888', fontSize: 10 }}>{vatRateLabel(l.vatRate)}</span>
              <span style={{ width: 80, textAlign: 'right', color: '#888' }}>{fmtAED(l.vatAmount)}</span>
              <span style={{ width: 90, textAlign: 'right', fontWeight: 700 }}>{fmtAED(l.lineTotal)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ textAlign: 'right', marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>Net Amount: {fmtAED(netAmount)}</div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>Total VAT: {fmtAED(taxTotal)}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, background: CRIMSON, color: '#fff', padding: '14px 24px', borderRadius: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.85 }}>TOTAL AMOUNT DUE</span>
            <span style={{ fontSize: 22, fontWeight: 900 }}>{fmtAED(payableAmount)}</span>
          </div>
        </div>

        {/* Tax breakdown */}
        <TaxBreakdown services={jobServices} parts={jobParts} />

        {/* Footer */}
        <div style={{ paddingTop: 16, borderTop: '1px solid #eee', fontSize: 10, color: '#aaa', lineHeight: 1.6, marginTop: 12 }}>
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
function MinimalTemplate({ invoice, job, jobServices, jobParts, companyInfo, logoDataUrl, einvoicingSettings: ei = {} }) {
  const lines = buildLines(jobServices, jobParts)
  const { netAmount, taxTotal, payableAmount } = invoice?.net_amount != null
    ? { netAmount: invoice.net_amount, taxTotal: invoice.tax_total, payableAmount: invoice.payable_amount ?? invoice.total_amount }
    : calculateInvoiceTotals(jobServices, jobParts)
  const isPaid = invoice?.status === 'paid'

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#111', maxWidth: 680, margin: '0 auto', padding: '60px 48px', background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
        <div>
          <LogoSlot logoDataUrl={logoDataUrl} companyName={companyInfo.companyName} style={{ fontSize: 18, fontWeight: 800 }} />
          <div style={{ marginTop: 8, fontSize: 10, color: '#bbb', lineHeight: 1.8 }}>
            {ei.tin && <div>TIN {ei.tin}</div>}
            {ei.legalRegNumber && <div>{ei.legalRegType} {ei.legalRegNumber}</div>}
            {ei.sellerStreet && <div>{ei.sellerStreet}{ei.sellerCity ? `, ${ei.sellerCity}` : ''}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#999', letterSpacing: 2, textTransform: 'uppercase' }}>Invoice</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{invoice?.invoice_number || 'DRAFT'}</div>
          <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>{fmtDate(invoice?.created_at)}</div>
          {invoice?.due_date && <div style={{ fontSize: 10, color: '#ccc', marginTop: 2 }}>Due {fmtDate(invoice.due_date)}</div>}
          <TxnFlags invoice={invoice} />
        </div>
      </div>

      {/* Client */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 10, color: '#bbb', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Billed to</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{job.customers?.name}</div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 3 }}>{job.customers?.phone} · {job.vehicles?.make} {job.vehicles?.model} {job.vehicles?.license_plate}</div>
        {invoice?.buyer_is_business && invoice?.buyer_legal_id_number && (
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>
            <div>{invoice.buyer_legal_id_type}: {invoice.buyer_legal_id_number}</div>
            {invoice.buyer_street && <div>{invoice.buyer_street}{invoice.buyer_city ? `, ${invoice.buyer_city}` : ''}</div>}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #f0f0f0', marginBottom: 16 }} />

      {/* Column headers */}
      <div style={{ display: 'flex', fontSize: 9, color: '#ccc', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid #f5f5f5' }}>
        <span style={{ flex: 1 }}>Description</span>
        <span style={{ width: 40, textAlign: 'center' }}>Qty</span>
        <span style={{ width: 90, textAlign: 'right' }}>Unit Price</span>
        <span style={{ width: 52, textAlign: 'right' }}>VAT%</span>
        <span style={{ width: 90, textAlign: 'right' }}>Total</span>
      </div>

      {/* Items */}
      {lines.map(l => (
        <div key={l.num} style={{ display: 'flex', padding: '9px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13, alignItems: 'center' }}>
          <span style={{ flex: 1 }}>{l.description}</span>
          <span style={{ width: 40, textAlign: 'center', color: '#bbb', fontSize: 11 }}>{l.qty}</span>
          <span style={{ width: 90, textAlign: 'right', color: '#555' }}>{fmtAED(l.unitPrice)}</span>
          <span style={{ width: 52, textAlign: 'right', color: '#bbb', fontSize: 10 }}>{vatRateLabel(l.vatRate)}</span>
          <span style={{ width: 90, textAlign: 'right', fontWeight: 600, color: '#333' }}>{fmtAED(l.lineTotal)}</span>
        </div>
      ))}

      {/* Totals */}
      {taxTotal > 0 && (
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0f0f0', fontSize: 12, color: '#888' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span>Net Amount</span><span>{fmtAED(netAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Total VAT</span><span>{fmtAED(taxTotal)}</span>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: taxTotal > 0 ? 8 : 24, paddingTop: 16, borderTop: '2px solid #111', fontSize: 18, fontWeight: 800 }}>
        <span>Total Amount Due</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isPaid && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#16a34a', textTransform: 'uppercase', border: '1px solid #16a34a', padding: '2px 8px', borderRadius: 3 }}>Paid</span>}
          <span>{fmtAED(payableAmount)}</span>
        </div>
      </div>

      {/* Tax breakdown */}
      <TaxBreakdown services={jobServices} parts={jobParts} />

      {/* Footer */}
      <div style={{ marginTop: 56, fontSize: 10, color: '#ccc', lineHeight: 1.8 }}>
        <div>{companyInfo.companyName} · {companyInfo.companyEmail} · {companyInfo.companyPhone}</div>
        {ei.tin && <div>TIN: {ei.tin} · Endpoint: 0235{ei.tin}</div>}
        {companyInfo.footerText && <div>{companyInfo.footerText}</div>}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// TEMPLATE 4 — Professional
// ══════════════════════════════════════════════════════════
function ProfessionalTemplate({ invoice, job, jobServices, jobParts, companyInfo, logoDataUrl, einvoicingSettings: ei = {} }) {
  const lines = buildLines(jobServices, jobParts)
  const { netAmount, taxTotal, payableAmount } = invoice?.net_amount != null
    ? { netAmount: invoice.net_amount, taxTotal: invoice.tax_total, payableAmount: invoice.payable_amount ?? invoice.total_amount }
    : calculateInvoiceTotals(jobServices, jobParts)
  const isPaid = invoice?.status === 'paid'
  const BLUE = '#1e40af'

  return (
    <div style={{ fontFamily: '"Segoe UI", Arial, sans-serif', color: '#1e293b', maxWidth: 760, margin: '0 auto', padding: '40px', background: '#fff' }}>
      {/* Two-column header */}
      <table style={{ width: '100%', marginBottom: 20, borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'top', paddingRight: 20 }}>
              <LogoSlot logoDataUrl={logoDataUrl} companyName={companyInfo.companyName} style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }} />
              <div style={{ marginTop: 10, fontSize: 11, color: '#64748b', lineHeight: 1.8 }}>
                {ei.tin && <div><strong>TIN:</strong> {ei.tin}</div>}
                {ei.legalRegNumber && <div>{ei.legalRegType}: {ei.legalRegNumber}</div>}
                {ei.sellerStreet && <div>{ei.sellerStreet}{ei.sellerCity ? `, ${ei.sellerCity}` : ''}{ei.sellerCountry ? `, ${ei.sellerCountry}` : ''}{ei.sellerPostalCode ? ` ${ei.sellerPostalCode}` : ''}</div>}
                {ei.tin && <div style={{ fontSize: 10, color: '#94a3b8' }}>Endpoint: 0235{ei.tin}</div>}
                <div>{companyInfo.companyEmail}</div>
                <div>{companyInfo.companyPhone}</div>
              </div>
            </td>
            <td style={{ verticalAlign: 'top', textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: BLUE, letterSpacing: -1 }}>INVOICE</div>
              <table style={{ marginLeft: 'auto', borderCollapse: 'collapse', marginTop: 8 }}>
                <tbody>
                  {[
                    ['Invoice No', invoice?.invoice_number || 'DRAFT'],
                    ['Date', fmtDate(invoice?.created_at)],
                    ...(invoice?.due_date ? [['Due Date', fmtDate(invoice.due_date)]] : []),
                    ['Job No', job.job_number],
                    ['Type', 'Commercial Invoice'],
                    ['Currency', invoice?.currency_code || 'AED'],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', paddingRight: 10, paddingBottom: 3, whiteSpace: 'nowrap' }}>{k}:</td>
                      <td style={{ fontSize: 12, fontWeight: 600, textAlign: 'right', paddingBottom: 3 }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TxnFlags invoice={invoice} />
            </td>
          </tr>
        </tbody>
      </table>

      {/* Bill To */}
      <div style={{ background: '#f1f5f9', borderLeft: `4px solid ${BLUE}`, padding: '14px 18px', marginBottom: 20, borderRadius: '0 6px 6px 0' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: BLUE, textTransform: 'uppercase', marginBottom: 6 }}>Bill To</div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{job.customers?.name}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
          {job.customers?.phone}
          {job.customers?.email && ` · ${job.customers.email}`}
        </div>
        <div style={{ fontSize: 12, color: '#64748b' }}>
          {job.vehicles?.make} {job.vehicles?.model} {job.vehicles?.year} · Plate: {job.vehicles?.license_plate}
        </div>
        {invoice?.buyer_is_business && invoice?.buyer_legal_id_number && (
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, paddingTop: 6, borderTop: '1px solid #cbd5e1' }}>
            <div>{invoice.buyer_legal_id_type}: {invoice.buyer_legal_id_number}</div>
            {invoice.buyer_street && <div>{invoice.buyer_street}{invoice.buyer_city ? `, ${invoice.buyer_city}` : ''}{invoice.buyer_country ? `, ${invoice.buyer_country}` : ''}{invoice.buyer_postal_code ? ` ${invoice.buyer_postal_code}` : ''}</div>}
          </div>
        )}
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 0 }}>
        <thead>
          <tr style={{ background: '#1e293b', color: '#fff' }}>
            <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', width: 28 }}>#</th>
            <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>Description</th>
            <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', width: 40 }}>Unit</th>
            <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', width: 40 }}>Qty</th>
            <th style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', width: 100 }}>Unit Price</th>
            <th style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', width: 55 }}>VAT%</th>
            <th style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', width: 90 }}>VAT (AED)</th>
            <th style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', width: 100 }}>Total (AED)</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={l.num} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '9px 10px', textAlign: 'center', color: '#94a3b8', fontSize: 11 }}>{l.num}</td>
              <td style={{ padding: '9px 10px' }}>{l.description}</td>
              <td style={{ padding: '9px 10px', textAlign: 'center', color: '#64748b', fontSize: 10 }}>{l.unit}</td>
              <td style={{ padding: '9px 10px', textAlign: 'center', color: '#64748b' }}>{l.qty}</td>
              <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 600 }}>{fmtAED(l.unitPrice)}</td>
              <td style={{ padding: '9px 10px', textAlign: 'right', color: '#64748b', fontSize: 10 }}>{vatRateLabel(l.vatRate)}</td>
              <td style={{ padding: '9px 10px', textAlign: 'right', color: '#64748b' }}>{fmtAED(l.vatAmount)}</td>
              <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 600 }}>{fmtAED(l.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '1px solid #cbd5e1' }}>
            <td style={{ padding: '7px 10px', fontSize: 11, color: '#94a3b8' }} colSpan={7}>Net Amount (excl. VAT)</td>
            <td style={{ padding: '7px 10px', textAlign: 'right', fontSize: 12, color: '#64748b' }}>{fmtAED(netAmount)}</td>
          </tr>
          <tr>
            <td style={{ padding: '4px 10px 10px', fontSize: 11, color: '#94a3b8' }} colSpan={7}>Total VAT</td>
            <td style={{ padding: '4px 10px 10px', textAlign: 'right', fontSize: 12, color: '#64748b' }}>{fmtAED(taxTotal)}</td>
          </tr>
          <tr style={{ background: BLUE }}>
            <td style={{ padding: '14px 10px', color: '#fff', fontWeight: 800, fontSize: 14 }} colSpan={7}>
              TOTAL AMOUNT DUE
              {isPaid && <span style={{ marginLeft: 12, background: '#fff', color: BLUE, fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 3, letterSpacing: 1 }}>✓ PAID</span>}
            </td>
            <td style={{ padding: '14px 10px', textAlign: 'right', color: '#fff', fontWeight: 900, fontSize: 20 }}>{fmtAED(payableAmount)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Tax breakdown */}
      <TaxBreakdown services={jobServices} parts={jobParts} labelStyle={{ background: '#fff' }} borderColor="#e2e8f0" />

      {/* Footer */}
      {companyInfo.footerText && (
        <div style={{ marginTop: 20, fontSize: 10, color: '#94a3b8', lineHeight: 1.7, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
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
  const einvoicingSettings = (() => {
    try { return JSON.parse(localStorage.getItem('pitstop_einvoicing') || '{}') } catch { return {} }
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
      einvoicingSettings={einvoicingSettings}
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
