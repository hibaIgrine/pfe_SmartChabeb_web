/**
 * IconActionButton.tsx — Bouton icône réutilisable dans PostComposer.
 *
 * RÔLE :
 *   Petit bouton avec icône + label utilisé pour les actions du compositeur :
 *   Ajouter une image, une vidéo, un fichier, etc.
 *
 * PROPS :
 *   label  — Texte affiché sous l'icône
 *   icon   — Composant icône React (Lucide)
 *   color  — Couleur du texte (classe Tailwind)
 *   bg     — Couleur de fond (classe Tailwind)
 *   onClick— Callback d'action
 */
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
      className={`rounded-lg border border-transparent ${bg} ${color} px-2 py-1.5 flex items-center gap-1.5 justify-center hover:brightness-95 transition-colors`}
    >
      {icon}
      <span className="text-[12px] font-bold">{label}</span>
    </button>
  );
}
