import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const TEMPLATE_URL = '/Bon_de_Commande.pdf'

// Baselines (y) calculées depuis les positions mesurées du modèle (origine bas-gauche)

const formatDZD = (n) =>
  `${Number(n || 0).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ')} DA`

const FIELDS = {
  bcNum: { x: 252, y: 669 },
  fournisseurNom: { x: 72, y: 583 },
  fournisseurEntreprise: { x: 92, y: 573 },
  fournisseurAdresse: { x: 84, y: 562 },
  fournisseurVille: { x: 173, y: 552 },
  fournisseurTel: { x: 92, y: 542 },
  date: { x: 50, y: 489 },
  soustotal: { x: 518, y: 318 },
  taxe: { x: 518, y: 300 },
  transp: { x: 518, y: 277 },
  total: { x: 518, y: 255 },
  autorisePar: { x: 340, y: 217 },
  titre: { x: 443, y: 217 },
  signature: { x: 50, y: 169 },
  signatureDate: { x: 290, y: 169 },
}

const ROWS = [
  { y: 424 },
  { y: 406 },
  { y: 388 },
  { y: 370 },
  { y: 352 },
  { y: 334 },
]

const COLUMNS = {
  numero: 48,
  description: 126,
  qte: 306,
  prix: 370,
  totalRight: 522,
}

function sanitize(text) {
  return String(text).replace(/[\u202f\u00a0]/g, ' ')
}

function drawText(page, font, size, text, x, y, { right = false } = {}) {
  if (text === undefined || text === null || text === '') return
  const value = sanitize(text)
  let tx = x
  if (right) tx = x - font.widthOfTextAtSize(value, size)
  page.drawText(value, { x: tx, y, size, font, color: rgb(0.12, 0.12, 0.12) })
}

async function fetchTemplate() {
  const res = await fetch(TEMPLATE_URL)
  return res.arrayBuffer()
}

function fillPage(page, font, bc) {
  const size = 9
  const lignes = bc.lignes || []
  const montant = lignes.reduce(
    (s, l) => s + Number(l.qte) * Number(l.prix_unitaire),
    0
  )

  drawText(page, font, size, bc.reference || `BC-${bc.id_bc}`, FIELDS.bcNum.x, FIELDS.bcNum.y)
  drawText(page, font, size, bc.fournisseur_nom, FIELDS.fournisseurNom.x, FIELDS.fournisseurNom.y)
  drawText(page, font, size, bc.fournisseur_nom, FIELDS.fournisseurEntreprise.x, FIELDS.fournisseurEntreprise.y)
  drawText(page, font, size, bc.fournisseur_adresse, FIELDS.fournisseurAdresse.x, FIELDS.fournisseurAdresse.y)
  drawText(page, font, size, 'Alger, Algérie', FIELDS.fournisseurVille.x, FIELDS.fournisseurVille.y)
  drawText(page, font, size, bc.fournisseur_tel ? String(bc.fournisseur_tel) : '', FIELDS.fournisseurTel.x, FIELDS.fournisseurTel.y)
  drawText(
    page,
    font,
    size,
    bc.date_creation ? new Date(bc.date_creation).toLocaleDateString('fr-FR') : '',
    FIELDS.date.x,
    FIELDS.date.y
  )

  lignes.slice(0, ROWS.length).forEach((l, i) => {
    const y = ROWS[i].y
    drawText(page, font, size, String(i + 1), COLUMNS.numero, y)
    drawText(page, font, size, l.produit_nom, COLUMNS.description, y)
    drawText(page, font, size, String(l.qte ?? ''), COLUMNS.qte, y)
    drawText(page, font, size, formatDZD(l.prix_unitaire), COLUMNS.prix, y)
    drawText(page, font, size, formatDZD(Number(l.qte) * Number(l.prix_unitaire)), COLUMNS.totalRight, y, { right: true })
  })

  drawText(page, font, size, formatDZD(montant), FIELDS.soustotal.x, FIELDS.soustotal.y, { right: true })
  drawText(page, font, size, '0', FIELDS.taxe.x, FIELDS.taxe.y, { right: true })
  drawText(page, font, size, '0', FIELDS.transp.x, FIELDS.transp.y, { right: true })
  drawText(page, font, size, formatDZD(montant), FIELDS.total.x, FIELDS.total.y, { right: true })

  drawText(page, font, size, bc.acheteur_nom, FIELDS.autorisePar.x, FIELDS.autorisePar.y)
  drawText(page, font, size, 'Acheteur', FIELDS.titre.x, FIELDS.titre.y)
  drawText(page, font, size, bc.acheteur_nom, FIELDS.signature.x, FIELDS.signature.y)
  drawText(page, font, size, new Date().toLocaleDateString('fr-FR'), FIELDS.signatureDate.x, FIELDS.signatureDate.y)
}

export async function generateBcPdf(bc) {
  const templateBytes = await fetchTemplate()
  const pdfDoc = await PDFDocument.load(templateBytes)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  fillPage(pdfDoc.getPage(0), font, bc)
  return pdfDoc.save()
}

export async function generateAllBcsPdf(bcs) {
  const templateBytes = await fetchTemplate()
  const pdfDoc = await PDFDocument.load(templateBytes)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  for (let i = 1; i < bcs.length; i++) {
    const tpl = await PDFDocument.load(templateBytes)
    const [page] = await pdfDoc.copyPages(tpl, [0])
    pdfDoc.addPage(page)
  }

  bcs.forEach((bc, i) => {
    fillPage(pdfDoc.getPage(i), font, bc)
  })

  return pdfDoc.save()
}

export function downloadBcPdf(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exporterPdfUn(bc) {
  const bytes = await generateBcPdf(bc)
  downloadBcPdf(bytes, `${bc.reference || bc.id_bc}.pdf`)
}

export async function exporterPdfTous(bcs) {
  const bytes = await generateAllBcsPdf(bcs)
  downloadBcPdf(bytes, 'bons-de-commande.pdf')
}
