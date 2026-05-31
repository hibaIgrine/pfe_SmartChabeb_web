import { useState } from "react";
import EventParticipantsPage from "./EventParticipantsPage";
import EventWaitingListPage from "./EventWaitingListPage";
import EventRequestsPage from "./EventRequestsPage";

export default function EventsManagerPage() {
  const [tab, setTab] = useState<"requests" | "participants" | "waiting">(
    "requests",
  );

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-[32px] border border-[#D8E5E8] bg-gradient-to-br from-[#23444C] via-[#2F5A63] to-[#436D75] p-7 md:p-8 text-white shadow-2xl">
        <div>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight">
            Gestion des Événements
          </h2>
          <p className="mt-2 text-sm md:text-base text-[#E2EEF1] font-medium max-w-2xl leading-7">
            Gérez les demandes, participants et listes d'attente depuis une
            seule page.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-4 md:p-5">
        <nav className="flex flex-wrap gap-2 mb-4 sticky top-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-2 border border-gray-100">
          <button
            onClick={() => setTab("requests")}
            className={`px-4 py-2 rounded-xl text-sm font-black ${
              tab === "requests"
                ? "bg-[#436D75] text-white"
                : "bg-gray-50 text-gray-700"
            }`}
          >
            Demandes
          </button>
          <button
            onClick={() => setTab("participants")}
            className={`px-4 py-2 rounded-xl text-sm font-black ${
              tab === "participants"
                ? "bg-[#436D75] text-white"
                : "bg-gray-50 text-gray-700"
            }`}
          >
            Participants
          </button>
          <button
            onClick={() => setTab("waiting")}
            className={`px-4 py-2 rounded-xl text-sm font-black ${
              tab === "waiting"
                ? "bg-[#436D75] text-white"
                : "bg-gray-50 text-gray-700"
            }`}
          >
            Liste d'attente
          </button>
        </nav>

        <div className="pt-2">
          {tab === "requests" && <EventRequestsPage />}
          {tab === "participants" && <EventParticipantsPage />}
          {tab === "waiting" && <EventWaitingListPage />}
        </div>
      </div>
    </div>
  );
}
