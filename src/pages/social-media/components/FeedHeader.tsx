import { useMemo, useState } from "react";
import { EyeOff, RefreshCw, X } from "lucide-react";
import type { HiddenUserLink } from "../../../api/social-media.api";

type FeedHeaderProps = {
  onRefresh: () => void;
  hiddenUsers: HiddenUserLink[];
  onUnhideUser: (userId: string) => void | Promise<void>;
};

export function FeedHeader({
  onRefresh,
  hiddenUsers,
  onUnhideUser,
}: FeedHeaderProps) {
  const [isHiddenUsersOpen, setIsHiddenUsersOpen] = useState(false);
  const [hiddenUsersSearch, setHiddenUsersSearch] = useState("");

  const filteredHiddenUsers = useMemo(() => {
    const query = hiddenUsersSearch.trim().toLowerCase();
    if (!query) {
      return hiddenUsers;
    }

    return hiddenUsers.filter((item) =>
      `${item.hidden_user.nom} ${item.hidden_user.prenom}`
        .toLowerCase()
        .includes(query),
    );
  }, [hiddenUsers, hiddenUsersSearch]);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#436D75]">
            Fil d actualite
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Creer une publication et la voir instantanement dans le feed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsHiddenUsersOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d8d1c2] bg-white px-3 py-2 text-[#705a44] text-sm font-bold hover:bg-[#f7f3e9] transition-colors"
          >
            <EyeOff size={15} />
            Personnes masquees
            <span className="rounded-full bg-[#f1e7dd] px-2 py-0.5 text-[11px]">
              {hiddenUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-xl bg-[#436D75] px-4 py-2 text-white text-sm font-bold hover:bg-[#2f4d53] transition-colors"
          >
            <RefreshCw size={16} />
            Actualiser
          </button>
        </div>
      </div>

      {isHiddenUsersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#e7dfcf] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#efe9db] px-4 py-3">
              <h3 className="text-sm font-black uppercase tracking-[0.08em] text-[#436D75]">
                Personnes masquees
              </h3>
              <button
                type="button"
                onClick={() => setIsHiddenUsersOpen(false)}
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <input
                value={hiddenUsersSearch}
                onChange={(event) => setHiddenUsersSearch(event.target.value)}
                placeholder="Rechercher une personne masquee"
                className="w-full rounded-xl border border-[#d8d1c2] px-3 py-2 text-sm outline-none focus:border-[#436D75]"
              />

              <div className="max-h-72 space-y-2 overflow-y-auto">
                {filteredHiddenUsers.length ? (
                  filteredHiddenUsers.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-[#efe9db] px-3 py-2"
                    >
                      <p className="text-sm font-semibold text-[#4f5d66]">
                        {item.hidden_user.nom} {item.hidden_user.prenom}
                      </p>
                      <button
                        type="button"
                        onClick={() => onUnhideUser(item.hidden_user_id)}
                        className="rounded-lg bg-[#eaf6ef] px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] text-[#2d7d4e] hover:bg-[#dff1e6]"
                      >
                        Demasquer
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-[#ddd3c3] px-3 py-5 text-center text-sm text-gray-400">
                    Aucune personne masquee.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
