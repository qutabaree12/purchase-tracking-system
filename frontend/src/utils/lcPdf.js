const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 32
const RIGHT = PAGE_WIDTH - MARGIN
const HEADER_HEIGHT = 121

const NAVY = { type: 'RGB', red: 0.086275, green: 0.196078, blue: 0.309804 }
const TEAL = { type: 'RGB', red: 0.0, green: 0.54902, blue: 0.584314 }
const TEXT_COLOR = { type: 'RGB', red: 0.12, green: 0.16, blue: 0.22 }
const MUTED_COLOR = { type: 'RGB', red: 0.39, green: 0.45, blue: 0.55 }
const BORDER_COLOR = { type: 'RGB', red: 0.88, green: 0.91, blue: 0.94 }
const LIGHT_COLOR = { type: 'RGB', red: 0.97, green: 0.98, blue: 0.99 }
const WHITE_COLOR = { type: 'RGB', red: 1, green: 1, blue: 1 }
const HEADER_MUTED = { type: 'RGB', red: 0.78, green: 0.85, blue: 0.9 }

let pdfLibPromise = null
function getPdfLib() {
  if (!pdfLibPromise) pdfLibPromise = import('pdf-lib')
  return pdfLibPromise
}

function sanitize(value) {
  return String(value ?? '').replace(/[\u202f\u00a0]/g, ' ')
}

function wrapText(font, size, text, maxWidth) {
  const words = sanitize(text).split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate
      continue
    }
    if (current) lines.push(current)
    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      current = word
      continue
    }
    let chunk = ''
    for (const char of word) {
      if (font.widthOfTextAtSize(chunk + char, size) <= maxWidth) {
        chunk += char
      } else {
        if (chunk) lines.push(chunk)
        chunk = char
      }
    }
    current = chunk
  }

  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function formatDate(value) {
  if (!value) return '—'
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('fr-FR')
}

function orDash(value) {
  const text = sanitize(value).trim()
  return text || '—'
}

function formatMontant(montant) {
  const cleaned = String(montant ?? '').replace(/\s/g, '')
  if (!cleaned) return '—'
  const nombre = Number(cleaned.replace(',', '.'))
  return Number.isFinite(nombre) ? nombre.toLocaleString('fr-FR') : cleaned
}

function moyenPaiement(typeCredit) {
  const type = String(typeCredit || '').toLowerCase()
  if (type.includes('à vue') || type.includes('a vue')) return 'À vue'
  if (type.includes('échéance') || type.includes('echeance') || type.includes('différé') || type.includes('differe')) {
    return 'À échéance'
  }
  return '—'
}

export function documentsChoisis(lc) {
  const labels = {
    facture: 'Facture commerciale conforme au contrat.',
    transport: 'Bon de livraison ou document de transport applicable.',
    colisage: 'Liste de colisage, si applicable.',
    origine: "Certificat d'origine, si requis.",
    reception: 'Procès-verbal de réception ou attestation de service fait, si applicable.',
    autre: 'Tout autre document expressément demandé dans le crédit documentaire.',
  }

  return Object.entries(labels)
    .filter(([key]) => lc.documents?.[key])
    .map(([key, label]) => (key === 'autre' && lc.autreDocument?.trim()
      ? `${label} ${lc.autreDocument.trim()}`
      : label))
}

export async function generateLcPdf(lc) {
  const { PDFDocument, StandardFonts } = await getPdfLib()
  const doc = await PDFDocument.create()
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const yForTop = (top, size) => PAGE_HEIGHT - top - size * 0.8

  const draw = (text, top, size, { x = MARGIN, usedFont = font, color = TEXT_COLOR } = {}) => {
    page.drawText(sanitize(text), { x, y: yForTop(top, size), size, font: usedFont, color })
  }

  const drawRight = (text, top, size, { x = RIGHT, usedFont = font, color = TEXT_COLOR } = {}) => {
    const value = sanitize(text)
    const valueWidth = usedFont.widthOfTextAtSize(value, size)
    page.drawText(value, { x: x - valueWidth, y: yForTop(top, size), size, font: usedFont, color })
  }

  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - HEADER_HEIGHT, width: PAGE_WIDTH, height: HEADER_HEIGHT, color: NAVY })
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - HEADER_HEIGHT - 4, width: PAGE_WIDTH, height: 4, color: TEAL })

  draw('ALGÉRIE TÉLÉCOM', 20, 16, { usedFont: bold, color: WHITE_COLOR })
  draw("Suivi du processus d'achat télécom", 47, 9, { color: HEADER_MUTED })
  drawRight(`RÉF. ${orDash(lc.referenceCredit)}`, 24, 10, { usedFont: bold, color: WHITE_COLOR })
  drawRight(`Émission : ${formatDate(lc.dateEmission)}`, 43, 9, { color: HEADER_MUTED })
  draw('LETTRE DE CRÉDIT', 72, 19, { usedFont: bold, color: WHITE_COLOR })

  let top = 142

  const sectionTitle = (numero, titre) => {
    draw(numero, top, 9, { usedFont: bold, color: TEAL })
    draw(titre, top, 10.5, { x: MARGIN + 27, usedFont: bold, color: NAVY })
    top += 20
  }

  const row = (label, value, { large = false } = {}) => {
    const labelSize = large ? 9.2 : 8.8
    const valueSize = large ? 10.5 : 9.5
    const valueX = large ? MARGIN + 170 : MARGIN + 160
    const lineHeight = valueSize + 3
    const lines = wrapText(font, valueSize, orDash(value), RIGHT - valueX)
    draw(label, top, labelSize, { color: MUTED_COLOR })
    lines.forEach((line, index) => {
      draw(line, top + index * lineHeight, valueSize, { x: valueX, color: TEXT_COLOR })
    })
    top += Math.max(1, lines.length) * lineHeight + (large ? 8 : 6)
  }

  sectionTitle('01', 'PARTIES AU CRÉDIT')
  row('Banque émettrice', lc.banque, { large: true })
  row('Demandeur / donneur d’ordre', lc.donneurOrdre, { large: true })
  row('Bénéficiaire', lc.beneficiaire, { large: true })
  row('Adresse du bénéficiaire', lc.adresseBeneficiaire, { large: true })

  top += 10
  sectionTitle('02', 'CARACTÉRISTIQUES ET OBJET')
  row('Type de crédit', lc.typeCredit, { large: true })
  row('Objet / marchandises', lc.objet, { large: true })
  row('Pays d’expédition / d’origine', lc.paysOrigine, { large: true })
  row('Lieu de livraison', lc.lieuLivraison, { large: true })
  row('Date limite d’expédition', formatDate(lc.dateLimiteExpedition), { large: true })
  const expiration = lc.dateExpiration
    ? `${formatDate(lc.dateExpiration)}${lc.lieuExpiration ? ` — ${lc.lieuExpiration}` : ''}`
    : ''
  row('Date et lieu d’expiration', expiration, { large: true })
  row('Règles applicables', lc.regles, { large: true })

  top += 10
  sectionTitle('03', 'DOCUMENTS À PRÉSENTER')
  const documents = documentsChoisis(lc)
  if (documents.length === 0) {
    draw('Aucun document sélectionné.', top, 9, { color: MUTED_COLOR })
    top += 18
  } else {
    documents.forEach((document, index) => {
      const lines = wrapText(font, 9.5, document, RIGHT - (MARGIN + 26))
      draw(String(index + 1).padStart(2, '0'), top, 8.5, { usedFont: bold, color: TEAL })
      lines.forEach((line, lineIndex) => {
        draw(line, top + lineIndex * 12.5, 9.5, { x: MARGIN + 26, color: TEXT_COLOR })
      })
      top += Math.max(1, lines.length) * 12.5 + 4
    })
  }

  top += 12
  const bandTop = top
  const bandHeight = 72
  page.drawRectangle({
    x: MARGIN,
    y: PAGE_HEIGHT - bandTop - bandHeight,
    width: RIGHT - MARGIN,
    height: bandHeight,
    color: LIGHT_COLOR,
    borderColor: BORDER_COLOR,
    borderWidth: 0.8,
  })
  page.drawRectangle({ x: MARGIN, y: PAGE_HEIGHT - bandTop - bandHeight, width: 3, height: bandHeight, color: TEAL })

  const devise = sanitize(lc.devise).trim() || 'DZD'
  const montantTexte = sanitize(`${formatMontant(lc.montant)} ${devise}`)
  let montantSize = 20
  while (montantSize > 12 && bold.widthOfTextAtSize(montantTexte, montantSize) > 240) {
    montantSize -= 1
  }

  draw('MONTANT DU CRÉDIT', bandTop + 12, 8, { x: MARGIN + 16, color: MUTED_COLOR })
  draw(montantTexte, bandTop + 24, montantSize, { x: MARGIN + 16, usedFont: bold, color: TEXT_COLOR })
  const lignesLettres = wrapText(font, 8.5, orDash(lc.montantLettres), 240)
  lignesLettres.slice(0, 2).forEach((line, index) => {
    draw(line, bandTop + 52 + index * 11, 8.5, { x: MARGIN + 16, color: MUTED_COLOR })
  })

  draw('PAIEMENT', bandTop + 12, 8, { x: MARGIN + 270, color: MUTED_COLOR })
  draw(moyenPaiement(lc.typeCredit), bandTop + 25, 13, { x: MARGIN + 270, usedFont: bold, color: TEXT_COLOR })
  draw('EXPIRATION', bandTop + 12, 8, { x: MARGIN + 400, color: MUTED_COLOR })
  draw(formatDate(lc.dateExpiration), bandTop + 25, 12, { x: MARGIN + 400, usedFont: bold, color: TEXT_COLOR })

  top = bandTop + bandHeight + 16
  sectionTitle('04', 'CONDITIONS DE PAIEMENT')
  const conditions = wrapText(font, 9, orDash(lc.conditionsPaiement), RIGHT - MARGIN)
  conditions.forEach((line, index) => {
    draw(line, top + index * 12, 9, { color: TEXT_COLOR })
  })

  const signatureTitleTop = 742
  const signatureLineTop = 800
  const signatureColumns = [
    { x: MARGIN, width: 160, label: 'Demandeur', sub: '' },
    { x: MARGIN + 182, width: 160, label: 'Banque émettrice', sub: 'Réservé à la banque' },
    { x: MARGIN + 365, width: 160, label: 'Bénéficiaire', sub: 'Le cas échéant' },
  ]

  draw('SIGNATURES / VALIDATION', signatureTitleTop, 8, { usedFont: bold, color: MUTED_COLOR })
  signatureColumns.forEach((column) => {
    page.drawLine({
      start: { x: column.x, y: PAGE_HEIGHT - signatureLineTop },
      end: { x: column.x + column.width, y: PAGE_HEIGHT - signatureLineTop },
      thickness: 0.8,
      color: BORDER_COLOR,
    })
    draw(column.label, signatureLineTop - 42, 8.5, { x: column.x, usedFont: bold, color: TEXT_COLOR })
    if (column.sub) {
      draw(column.sub, signatureLineTop - 30, 7, { x: column.x, color: MUTED_COLOR })
    }
  })

  page.drawLine({
    start: { x: MARGIN, y: PAGE_HEIGHT - 812 },
    end: { x: RIGHT, y: PAGE_HEIGHT - 812 },
    thickness: 1,
    color: TEAL,
  })
  draw(`${orDash(lc.referenceCredit)} | Algérie Télécom`, 820, 7, { color: MUTED_COLOR })
  drawRight('Page 1 / 1', 820, 7, { color: MUTED_COLOR })

  return doc.save()
}

export function downloadLcPdf(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
