import { RefreshCw } from "lucide-react";

type FeedHeaderProps = {
  onRefresh: () => void;
};

export function FeedHeader({ onRefresh }: FeedHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#436D75]">
          Fil d actualite
        </h1>
        <p className="text-sm text-gray-500 font-medium">
          Creer une publication et la voir instantanement dans le feed.
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        className="inline-flex items-center gap-2 rounded-xl bg-[#436D75] px-4 py-2 text-white text-sm font-bold hover:bg-[#2f4d53] transition-colors"
      >
        <RefreshCw size={16} />
        Actualiser
      </button>
    </div>
  );
}
