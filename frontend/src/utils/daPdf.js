import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { formatCurrency, formatDate } from './format'

function sanitize(text) {
  return String(text ?? '')
    .replace(/[\u202f\u00a0]/g, ' ')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
}

function drawText(page, font, size, text, x, y, { bold = false } = {}) {
  if (text === undefined || text === null || text === '') return

  const value = sanitize(text)

  page.drawText(value, {
    x,
    y,
    size,
    font,
    color: rgb(0.12, 0.12, 0.12),
  })
}

export async function generateDaPdf(demande) {
  const pdfDoc = await PDFDocument.create()

  const page = pdfDoc.addPage([595, 842])

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const marginX = 50
  let y = 800

  const drawLine = (
    text,
    { bold = false, size = 10, gap = 18 } = {}
  ) => {
    drawText(
      page,
      bold ? fontBold : font,
      size,
      text,
      marginX,
      y
    )

    y -= gap
  }

  drawLine('ALGERIE TELECOM', {
    bold: true,
    size: 16,
    gap: 22,
  })

  drawLine("Fiche Demande d'Achat", {
    bold: true,
    size: 13,
    gap: 30,
  })

  drawLine(`N° DA : ${demande.numero_da}`, {
    bold: true,
  })

  drawLine(`DOT : ${demande.dot || '—'}`)

  drawLine(`Demandeur : ${demande.demandeur_nom}`)

  drawLine(
    `Acheteur : ${demande.acheteur_nom || 'Non assigné'}`
  )

  drawLine(
    `Date de création : ${
      demande.date_creation
        ? formatDate(demande.date_creation)
        : '—'
    }`
  )

  if (demande.statut === 'approuvee') {
    drawLine(
      `Date d'approbation : ${
        demande.date_approbation
          ? formatDate(demande.date_approbation)
          : '—'
      }`
    )
  }

  if (demande.statut === 'refusee') {
    drawLine(
      `Date de rejet : ${
        demande.date_rejet
          ? formatDate(demande.date_rejet)
          : '—'
      }`
    )

    drawLine(
      `Motif du refus : ${demande.motif_refus || '—'}`
    )
  }

  drawLine(`Statut : ${demande.statut}`)

  drawLine(`Objet : ${demande.objet || '—'}`, {
    gap: 30,
  })

  // =========================
  // TABLEAU
  // =========================

  drawLine('Lignes de la demande', {
    bold: true,
    size: 12,
    gap: 20,
  })

  const colX = {
    desig: 50,
    qte: 330,
    prix: 400,
    total: 480,
  }

  drawText(
    page,
    fontBold,
    9,
    'Désignation',
    colX.desig,
    y
  )

  drawText(
    page,
    fontBold,
    9,
    'Qté',
    colX.qte,
    y
  )

  drawText(
    page,
    fontBold,
    9,
    'Prix unit.',
    colX.prix,
    y
  )

  drawText(
    page,
    fontBold,
    9,
    'Total',
    colX.total,
    y
  )

  y -= 18

  let total = 0

  const lignes = Array.isArray(demande.lignes)
    ? demande.lignes
    : []

  lignes.forEach((ligne) => {
    const qte = Number(ligne.qte || 0)
    const prixUnit = Number(ligne.prix_unit || 0)
    const ligneTotal = qte * prixUnit

    total += ligneTotal

    drawText(
      page,
      font,
      9,
      ligne.designation || '—',
      colX.desig,
      y
    )

    drawText(
      page,
      font,
      9,
      String(qte),
      colX.qte,
      y
    )

    drawText(
      page,
      font,
      9,
      formatCurrency(prixUnit),
      colX.prix,
      y
    )

    drawText(
      page,
      font,
      9,
      formatCurrency(ligneTotal),
      colX.total,
      y
    )

    y -= 16
  })

  y -= 10

  drawText(
    page,
    fontBold,
    11,
    `Total : ${formatCurrency(total)}`,
    colX.total - 40,
    y
  )

  return pdfDoc.save()
}

export function downloadDaPdf(bytes, filename) {
  const blob = new Blob([bytes], {
    type: 'application/pdf',
  })

  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()

  URL.revokeObjectURL(url)
}

export async function exporterDaPdf(demande) {
  const bytes = await generateDaPdf(demande)

  downloadDaPdf(
    bytes,
    `${demande.numero_da || demande.id_da}.pdf`
  )
}