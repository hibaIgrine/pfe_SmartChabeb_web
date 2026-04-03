import { User } from "lucide-react";

type Props = {
  responsable: any;
};

export function ClubResponsableSection({ responsable }: Props) {
  return (
    <section className="bg-[#F7F3E9] border border-gray-100 rounded-[32px] p-6">
      <div className="mb-6">
        <h2 className="text-xl font-black text-smart-teal">Responsable principal</h2>
        <p className="text-sm text-gray-500">Le responsable officiel du club.</p>
      </div>

      {responsable ? (
        <div className="rounded-3xl bg-white border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[24px] bg-smart-sage/50 flex items-center justify-center text-xl text-smart-teal">
              <User size={24} />
            </div>
            <div>
              <div className="mt-2 text-lg font-black text-gray-900">
                {responsable?.nom ?? ""} {responsable?.prenom ?? ""}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-gray-100 p-6 text-sm text-gray-500">
          Aucun responsable assigné pour le moment.
        </div>
      )}
    </section>
  );
}
