import type { ReactNode } from "react";

type IconActionButtonProps = {
  label: string;
  icon: ReactNode;
  color: string;
  bg: string;
  onClick: () => void;
};

export function IconActionButton({
  label,
  icon,
  color,
  bg,
  onClick,
}: IconActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border border-transparent ${bg} ${color} px-2 py-2 flex items-center gap-2 justify-center hover:brightness-95 transition-colors`}
    >
      {icon}
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}
