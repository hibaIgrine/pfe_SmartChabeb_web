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
}

export const generatePaymentReceipt = (payment: PaymentItem) => {
  const doc = new jsPDF();
  
  // Configuration des couleurs
  const primaryColor = [67, 109, 117]; // #436D75
  const lightGray = [245, 245, 245];
  
  // En-tête institutionnel simple
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Texte blanc pour l'en-tête
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  
  // République Tunisienne
  doc.text('République Tunisienne', 20, 20);
  
  // Ministère
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Ministère de la Jeunesse et des Sports', 20, 25);
  
  // Titre dans la partie blanche
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Reçu de Paiement', 105, 55, { align: 'center' });
  
  // Informations du reçu
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Reçu N°: ${payment.id.substring(0, 8).toUpperCase()}`, 20, 65);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date(payment.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })}`, 20, 75);
  
  doc.text(`Heure: ${new Date(payment.created_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })}`, 20, 85);
  
  // Informations de l'utilisateur
  if (payment.user) {
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(15, 95, 180, 10, 'F');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Informations du Bénéficiaire', 20, 102);
    
    doc.setFont('helvetica', 'normal');
    const userPrenom = payment.user.prenom || '';
    const userNom = payment.user.nom || '';
    const userEmail = payment.user.email || '';
    
    doc.text(`Nom complet: ${userPrenom} ${userNom}`, 20, 112);
    doc.text(`Email: ${userEmail}`, 20, 122);
  }
  
  // Détails du paiement
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(15, 130, 180, 10, 'F');
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Détails du Paiement', 20, 138);
  
  // Détails du paiement
  doc.setFont('helvetica', 'normal');
  doc.text(`Montant: ${payment.amount.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'TND'
  })}`, 20, 150);
  
  doc.text(`Méthode: ${payment.payment_method}`, 20, 160);
  
  // Statut avec couleur
  if (payment.status === 'PAID') {
    doc.setTextColor(0, 128, 0); // Vert
    doc.text('Statut: Payé', 20, 170);
  } else {
    doc.setTextColor(255, 0, 0); // Rouge
    doc.text(`Statut: ${payment.status}`, 20, 170);
  }
  
  // Détails de la réservation
  if (payment.reservation) {
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(15, 180, 180, 10, 'F');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Détails de la Réservation', 20, 188);
    
    // Détails de la réservation
    doc.setFont('helvetica', 'normal');
    doc.text(`Référence: ${payment.reservation.id}`, 20, 198);
    doc.text(`Objet: ${payment.reservation.objet}`, 20, 208);
    
    if (payment.reservation.local) {
      doc.text(`Local: ${payment.reservation.local.nom}`, 20, 218);
    }
    
    doc.text(`Date: ${new Date(payment.reservation.date_reservation).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`, 20, 228);
  }
  
  // Pied de page institutionnel
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 340, 210, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Merci pour votre paiement!', 105, 285, { align: 'center' });
  doc.text('Smart Chabeb - Ministère de la Jeunesse et des Sports', 105, 295, { align: 'center' });
  
  // Téléchargement du PDF
  const fileName = `recu_paiement_${payment.id.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
