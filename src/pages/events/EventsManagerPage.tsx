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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black italic text-smart-teal">
            Gestion des Événements
          </h2>
          <p className="text-sm text-gray-500 font-semibold">
            Gérez les demandes, participants et listes d'attente depuis une
            seule page.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-4">
        <nav className="flex gap-2 mb-4">
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

        <div>
          {tab === "requests" && <EventRequestsPage />}
          {tab === "participants" && <EventParticipantsPage />}
          {tab === "waiting" && <EventWaitingListPage />}
        </div>
      </div>
    </div>
  );
}
