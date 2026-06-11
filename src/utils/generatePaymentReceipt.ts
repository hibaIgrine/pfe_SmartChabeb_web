import jsPDF from 'jspdf';

export interface PaymentItem {
  id: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  payment_method: string;
  created_at: string;
  updated_at: string;
  reservation?: {
    id: string;
    objet: string;
    local: {
      nom: string;
      centre?: { nom?: string };
    };
    date_reservation: string;
  };
  stripe_session_id?: string;
  stripe_payment_id?: string;
  user?: {
    nom: string;
    prenom: string;
    email: string;
  };
  centreName?: string;
}

// ── helpers ────────────────────────────────────────────────────────────────

type RGB = readonly [number, number, number];

const TEAL  = [67, 109, 117] as const;
const DARK  = [32,  58,  67] as const;
const WHITE = [255, 255, 255] as const;
const LGRAY = [248, 249, 250] as const;
const MGRAY = [220, 224, 226] as const;
const BLACK = [30,  30,  30] as const;
const GREEN = [22, 163,  74] as const;

const setFill   = (doc: jsPDF, c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
const setStroke = (doc: jsPDF, c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
const setTxt    = (doc: jsPDF, c: RGB) => doc.setTextColor(c[0], c[1], c[2]);

function isArabic(text: string): boolean {
  return /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.test(text);
}

/**
 * Render a string (including Arabic/RTL) onto an offscreen canvas and return
 * a PNG data-URL with its mm dimensions for jsPDF.addImage.
 */
function textToImage(
  text: string,
  fontSizePx: number,
  color = '#000000',
): { dataUrl: string; wMM: number; hMM: number } {
  const scale   = 3;          // retina quality
  const padX    = 10;
  const padY    = 6;
  const fontDef = `bold ${fontSizePx}px Arial, sans-serif`;

  // Measure on a temporary canvas
  const tmp = document.createElement('canvas');
  const tmx = tmp.getContext('2d')!;
  tmx.font  = fontDef;
  const measured = tmx.measureText(text).width;

  const cw = Math.ceil(measured + padX * 2);
  const ch = Math.ceil(fontSizePx * 1.6 + padY);

  const canvas = document.createElement('canvas');
  canvas.width  = cw * scale;
  canvas.height = ch * scale;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.font          = fontDef;
  ctx.fillStyle     = color;
  ctx.textBaseline  = 'middle';
  ctx.direction     = 'rtl';
  ctx.textAlign     = 'right';
  ctx.fillText(text, cw - padX, ch / 2);

  // px → mm  (96 dpi → 1 px = 0.264583 mm)
  return {
    dataUrl: canvas.toDataURL('image/png'),
    wMM: cw * 0.264583,
    hMM: ch * 0.264583,
  };
}

function sectionTitle(doc: jsPDF, label: string, y: number): number {
  setFill(doc, TEAL);
  doc.rect(15, y, 180, 8, 'F');
  setTxt(doc, WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(label.toUpperCase(), 20, y + 5.5);
  return y + 8;
}

function labelValue(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  maxWidth = 75,
): void {
  setTxt(doc, [130, 130, 130]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(label, x, y);
  setTxt(doc, BLACK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(value, maxWidth);
  doc.text(lines, x, y + 5);
}

// ── main export ────────────────────────────────────────────────────────────

export const generatePaymentReceipt = (payment: PaymentItem): void => {
  const doc     = new jsPDF({ unit: 'mm', format: 'a4' });
  const W       = 210;
  const MARGIN  = 15;
  const CONTENT = W - MARGIN * 2;

  const centreName =
    payment.centreName ||
    payment.reservation?.local?.centre?.nom ||
    'Maison des Jeunes';

  // ── HEADER ────────────────────────────────────────────────────────────────
  setFill(doc, TEAL);
  doc.rect(0, 0, W, 40, 'F');

  // Left: République Tunisienne
  setTxt(doc, WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('République Tunisienne', MARGIN, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Ministère de la Jeunesse et des Sports', MARGIN, 20);

  // Vertical separator (same color as background — invisible)
  setStroke(doc, TEAL);
  doc.setLineWidth(0.4);
  doc.line(W / 2, 5, W / 2, 35);

  // Right: Centre — handle Arabic with canvas fallback
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Maison des Jeunes', W - MARGIN, 12, { align: 'right' });

  if (isArabic(centreName)) {
    const img = textToImage(centreName, 11, '#FFFFFF');
    // Place image right-aligned
    const x = W - MARGIN - img.wMM;
    doc.addImage(img.dataUrl, 'PNG', x, 18, img.wMM, img.hMM);
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(centreName, 85);
    doc.text(lines, W - MARGIN, 20, { align: 'right' });
  }

  // Bottom dark band
  setFill(doc, DARK);
  doc.rect(0, 40, W, 5, 'F');

  // ── TITLE ─────────────────────────────────────────────────────────────────
  setTxt(doc, DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('REÇU DE PAIEMENT', W / 2, 57, { align: 'center' });

  setStroke(doc, TEAL);
  doc.setLineWidth(0.8);
  doc.line(70, 60, 140, 60);

  // ── RECEIPT META ──────────────────────────────────────────────────────────
  const receiptNum = payment.id.substring(0, 8).toUpperCase();
  const payDate    = new Date(payment.created_at);
  const dateStr    = payDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr    = payDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  setFill(doc, LGRAY);
  setStroke(doc, MGRAY);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, 64, CONTENT, 20, 2, 2, 'FD');

  setTxt(doc, [130, 130, 130]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('N° REÇU', MARGIN + 6, 72);
  setTxt(doc, TEAL);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(receiptNum, MARGIN + 6, 80);

  setStroke(doc, MGRAY);
  doc.line(W / 2 - 5, 67, W / 2 - 5, 81);

  setTxt(doc, [130, 130, 130]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('DATE', W / 2 + 2, 69);
  doc.text('HEURE', W / 2 + 50, 69);

  setTxt(doc, BLACK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(dateStr, W / 2 + 2, 77);
  doc.text(timeStr, W / 2 + 50, 77);

  let y = 92;

  // ── BÉNÉFICIAIRE ──────────────────────────────────────────────────────────
  if (payment.user) {
    y = sectionTitle(doc, 'Informations du Bénéficiaire', y);
    setFill(doc, WHITE);
    setStroke(doc, MGRAY);
    doc.setLineWidth(0.3);
    doc.rect(MARGIN, y, CONTENT, 22, 'FD');

    const fullName = `${payment.user.prenom} ${payment.user.nom}`.trim();
    labelValue(doc, 'Nom & Prénom', fullName, MARGIN + 5, y + 6, 70);
    labelValue(doc, 'Adresse e-mail', payment.user.email, W / 2 + 5, y + 6, 80);

    y += 22 + 6;
  }

  // ── PAIEMENT ──────────────────────────────────────────────────────────────
  y = sectionTitle(doc, 'Détails du Paiement', y);
  setFill(doc, WHITE);
  setStroke(doc, MGRAY);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, y, CONTENT, 30, 'FD');

  setFill(doc, LGRAY);
  doc.rect(MARGIN + 4, y + 4, 55, 22, 'F');
  setTxt(doc, [130, 130, 130]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('MONTANT TOTAL', MARGIN + 6, y + 10);
  setTxt(doc, TEAL);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(
    payment.amount.toLocaleString('fr-FR', { minimumFractionDigits: 3 }) + ' TND',
    MARGIN + 6,
    y + 22,
  );

  const methodLabel = payment.payment_method === 'stripe'
    ? 'Paiement en ligne (Stripe)'
    : payment.payment_method;
  labelValue(doc, 'Méthode de paiement', methodLabel, MARGIN + 70, y + 6, 55);

  const isPaid    = payment.status === 'PAID';
  const statusTxt = isPaid ? 'Payé ✓' : payment.status;
  setTxt(doc, isPaid ? GREEN : [185, 28, 28]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('STATUT', W - MARGIN - 35, y + 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(statusTxt, W - MARGIN - 35, y + 20);

  y += 30 + 6;

  // ── RÉSERVATION ───────────────────────────────────────────────────────────
  if (payment.reservation) {
    y = sectionTitle(doc, 'Détails de la Réservation', y);
    setFill(doc, WHITE);
    setStroke(doc, MGRAY);
    doc.setLineWidth(0.3);
    doc.rect(MARGIN, y, CONTENT, 42, 'FD');

    const resDate = new Date(payment.reservation.date_reservation)
      .toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    labelValue(doc, 'Référence de réservation', payment.reservation.id, MARGIN + 5, y + 5, CONTENT - 10);
    labelValue(doc, 'Objet', payment.reservation.objet, MARGIN + 5, y + 17, CONTENT / 2 - 10);
    labelValue(doc, 'Local', payment.reservation.local?.nom ?? '—', W / 2 + 5, y + 17, CONTENT / 2 - 10);
    labelValue(doc, 'Date de réservation', resDate, MARGIN + 5, y + 29, CONTENT - 10);

    y += 42 + 6;
  }

  // ── ÉTABLISSEMENT ─────────────────────────────────────────────────────────
  y = sectionTitle(doc, 'Établissement', y);
  setFill(doc, WHITE);
  setStroke(doc, MGRAY);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, y, CONTENT, isArabic(centreName) ? 22 : 16, 'FD');

  if (isArabic(centreName)) {
    setTxt(doc, [130, 130, 130]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Maison des Jeunes', MARGIN + 5, y + 6);

    const img = textToImage(centreName, 11, '#1e1e1e');
    doc.addImage(img.dataUrl, 'PNG', MARGIN + 5, y + 9, img.wMM, img.hMM);

    labelValue(
      doc,
      'Organisme de tutelle',
      'Ministère de la Jeunesse et des Sports',
      W / 2 + 5,
      y + 4,
      CONTENT / 2 - 10,
    );
    y += 22 + 6;
  } else {
    labelValue(doc, 'Maison des Jeunes', centreName, MARGIN + 5, y + 4, CONTENT / 2 - 10);
    labelValue(
      doc,
      'Organisme de tutelle',
      'Ministère de la Jeunesse et des Sports',
      W / 2 + 5,
      y + 4,
      CONTENT / 2 - 10,
    );
    y += 16 + 6;
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  setFill(doc, DARK);
  doc.rect(0, 280, W, 17, 'F');

  setTxt(doc, WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Smart Chabeb', W / 2, 288, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    'Ministère de la Jeunesse et des Sports — Tunisie',
    W / 2,
    294,
    { align: 'center' },
  );

  // ── SAVE ──────────────────────────────────────────────────────────────────
  const fileName = `recu_paiement_${payment.id.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
