import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchUnreadMessagesCount } from "../../api/messagerie.api";

export function MessageBell() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = async () => {
    try {
      const data = await fetchUnreadMessagesCount();
      setUnreadCount(data.count ?? 0);
    } catch {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    void refreshUnreadCount();

    const interval = window.setInterval(() => {
      void refreshUnreadCount();
    }, 25000);

    const handleMessageRead = () => {
      void refreshUnreadCount();
    };

    window.addEventListener(
      "messagerie-updated",
      handleMessageRead as EventListener,
    );

    return () => {
      window.clearInterval(interval);
      window.removeEventListener(
        "messagerie-updated",
        handleMessageRead as EventListener,
      );
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => navigate("/messagerie")}
      className="relative w-10 h-10 rounded-full border border-gray-200 bg-white text-[#436D75] flex items-center justify-center hover:bg-[#F7F3E9] hover:border-[#cfdad3] transition-colors"
      title="Messagerie"
      aria-label="Messagerie"
    >
      <MessageSquare size={18} />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#E98A7D] px-1 text-[10px] font-black text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </button>
  );
}
