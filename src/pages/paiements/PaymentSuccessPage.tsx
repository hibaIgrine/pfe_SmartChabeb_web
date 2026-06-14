/**
 * PaymentSuccessPage.tsx — Page de confirmation de paiement Stripe.
 *
 * RÔLE :
 *   Page de retour après une session de paiement Stripe réussie.
 *   Stripe redirige vers cette URL après la complétion du checkout.
 *
 * FLUX :
 *   1. Stripe redirige vers /payment-success?session_id=<stripe_session_id>
 *   2. Un timer de 2s simule le "traitement" (animation spinner)
 *   3. isProcessing = false → affiche le message de succès avec CheckCircle
 *   4. L'utilisateur peut naviguer vers ses réservations ou l'historique
 *
 * PAGE PUBLIQUE :
 *   Accessible sans Layout (pas de sidebar/topbar) car Stripe redirige sur cette URL
 *   directement depuis son domaine.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, CreditCard, ArrowRight } from "lucide-react";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Simuler le traitement du paiement et rediriger après 3 secondes
    const timer = setTimeout(() => {
      setIsProcessing(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleGoToReservations = () => {
    navigate("/club-my-reservations");
  };

  return (
    <div className="min-h-screen bg-[#F7F3E9] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          {/* Icône de succès animée */}
          <div className="mb-6">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 transition-all duration-1000 ${
              isProcessing ? 'scale-90 opacity-50' : 'scale-100 opacity-100'
            }`}>
              <CheckCircle 
                size={40} 
                className={`text-green-600 transition-all duration-1000 ${
                  isProcessing ? 'scale-0' : 'scale-100'
                }`}
              />
            </div>
          </div>

          {/* Titre et message */}
          <h1 className="text-3xl font-black text-[#436D75] mb-4">
            {isProcessing ? "Traitement en cours..." : "Paiement réussi !"}
          </h1>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            {isProcessing 
              ? "Nous traitons votre paiement. Veuillez patienter quelques instants..."
              : "Votre paiement a été effectué avec succès. Votre réservation est maintenant confirmée."
            }
          </p>

          {/* Détails du paiement */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <CreditCard size={20} className="text-gray-400" />
              <span className="text-sm font-bold text-gray-600">Paiement sécurisé</span>
            </div>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Transaction validée</p>
              <p>• Réservation confirmée</p>
            </div>
          </div>

          {/* Bouton d'action */}
          <button
            onClick={handleGoToReservations}
            disabled={isProcessing}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-black text-white transition-all duration-300 ${
              isProcessing 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-[#436D75] hover:bg-[#355960] transform hover:scale-105'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                Traitement...
              </>
            ) : (
              <>
                Voir mes réservations
                <ArrowRight size={20} />
              </>
            )}
          </button>

          {/* Texte informatif */}
          {!isProcessing && (
            <p className="text-xs text-gray-400 mt-4">
              Vous allez être redirigé vers vos réservations pour voir les détails de votre paiement.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            Smart Chabeb - Ministère de la Jeunesse et des Sports
          </p>
        </div>
      </div>
    </div>
  );
}
