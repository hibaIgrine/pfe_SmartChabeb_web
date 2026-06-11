import { useEffect, useState } from "react";
import { Search, Calendar, Filter, CreditCard, CheckCircle, XCircle, Clock, Download } from "lucide-react";
import api from "../../api/axios";
import { generatePaymentReceipt, type PaymentItem } from "../../utils/generatePaymentReceipt";

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const handleDownloadReceipt = (payment: PaymentItem) => {
    const userStr = localStorage.getItem('user');
    let userInfo = undefined;
    let centreName: string | undefined = undefined;

    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        userInfo = {
          nom: u.nom || '',
          prenom: u.prenom || '',
          email: u.email || '',
        };
        // Try several places where the centre name could be stored
        centreName =
          u?.centre?.nom ||
          u?.clubs_diriges?.[0]?.centre?.nom ||
          payment.reservation?.local?.centre?.nom ||
          undefined;
      } catch {
        // ignore parse errors
      }
    }

    generatePaymentReceipt({ ...payment, user: userInfo, centreName });
  };

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/payments/my-payments");
      setPayments(res.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des paiements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = 
      payment.reservation?.objet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reservation?.local?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.payment_method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    
    const matchesDate = !dateFilter || 
      new Date(payment.created_at).toLocaleDateString() === new Date(dateFilter).toLocaleDateString();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'FAILED':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'REFUNDED':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'PENDING':
        return <Clock size={16} className="text-yellow-600" />;
      case 'FAILED':
        return <XCircle size={16} className="text-red-600" />;
      case 'REFUNDED':
        return <CreditCard size={16} className="text-blue-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID': return 'Payé';
      case 'PENDING': return 'En attente';
      case 'FAILED': return 'Échoué';
      case 'REFUNDED': return 'Remboursé';
      default: return status;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-[#436D75] tracking-tight">
          Historique des Paiements
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Consultez toutes vos transactions et paiements.
        </p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une réservation, local, méthode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#436D75] focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="min-w-[150px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#436D75] focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="PAID">Payés</option>
              <option value="PENDING">En attente</option>
              <option value="FAILED">Échoués</option>
              <option value="REFUNDED">Remboursés</option>
            </select>
          </div>
          
          <div className="min-w-[150px]">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#436D75] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Liste des paiements */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-400">Chargement des paiements...</div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all" || dateFilter 
                ? "Aucun paiement ne correspond à vos critères de recherche." 
                : "Vous n'avez aucun paiement enregistré."}
            </p>
          </div>
        ) : (
          filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-[#436D75]">
                      {payment.reservation?.objet || 'Paiement sans réservation'}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(payment.status)}
                        {getStatusText(payment.status)}
                      </span>
                    </span>
                  </div>
                  
                  {payment.reservation && (
                    <div className="text-sm text-gray-600 mb-3">
                      <p>📍 {payment.reservation.local?.nom}</p>
                      <p>📅 {new Date(payment.reservation.date_reservation).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <CreditCard size={14} />
                      {payment.payment_method}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="text-xs text-gray-400">
                      ID: {payment.id.substring(0, 8)}...
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-black text-[#436D75]">
                    {payment.amount.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'TND'
                    })}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(payment.created_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <button
                    onClick={() => handleDownloadReceipt(payment)}
                    className="mt-2 flex items-center gap-2 px-3 py-2 bg-[#436D75] text-white rounded-lg hover:bg-[#355960] transition-colors text-sm"
                    title="Télécharger le reçu PDF"
                  >
                    <Download size={14} />
                    Reçu
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
