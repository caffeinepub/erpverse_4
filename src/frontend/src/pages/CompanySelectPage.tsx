import { ArrowLeft, Building2, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "../components/ui/badge";
import type { Company } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useActor } from "../hooks/useActor";

interface Props {
  userId: string;
  onSelect: (companyId: string) => void;
  onBack: () => void;
}

interface MembershipInfo {
  companyId: string;
  roles: Array<Record<string, unknown>>;
}

export default function CompanySelectPage({ userId, onSelect, onBack }: Props) {
  const { t } = useLanguage();
  const { actor } = useActor();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [memberships, setMemberships] = useState<MembershipInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor) return;
    Promise.all([
      actor.getUserCompanies(userId),
      actor.getCompanyMemberships(userId),
    ])
      .then(([companiesData, membershipsData]) => {
        setCompanies(
          companiesData.map((c) => ({
            id: c.id,
            name: c.name,
            sector: c.sector,
            address: c.address,
            contactEmail: c.contactEmail,
            phone: c.phone,
            foundedYear: c.foundedYear,
            ownerId: c.ownerId,
            createdAt: c.createdAt.toString(),
          })),
        );
        setMemberships(
          membershipsData.map((m) => ({
            companyId: m.companyId,
            roles: m.roles as any[],
          })),
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actor, userId]);

  const getRoleInfo = (companyId: string): { label: string; color: string } => {
    const m = memberships.find((ms) => ms.companyId === companyId);
    if (!m || m.roles.length === 0)
      return {
        label: t("role.employee"),
        color: "border-purple-500/30 text-purple-300",
      };
    const role = m.roles[0];
    if ("CompanyOwner" in role)
      return {
        label: t("role.owner"),
        color: "border-blue-500/30 text-blue-300",
      };
    if ("CompanyManager" in role)
      return {
        label: t("role.manager"),
        color: "border-emerald-500/30 text-emerald-300",
      };
    if ("CompanyAdmin" in role)
      return {
        label: t("role.admin"),
        color: "border-orange-500/30 text-orange-300",
      };
    return {
      label: t("role.employee"),
      color: "border-purple-500/30 text-purple-300",
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <header className="flex items-center px-6 py-4 border-b border-white/10">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t("nav.back")}</span>
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-white mb-2">
            {t("company.select.title")}
          </h2>
          <p className="text-slate-400 mb-8">{t("company.select.subtitle")}</p>

          {loading ? (
            <div
              className="text-slate-400 text-center"
              data-ocid="company.loading_state"
            >
              {t("common.loading")}
            </div>
          ) : (
            <div className="space-y-3">
              {companies.map((company, i) => {
                const roleInfo = getRoleInfo(company.id);
                return (
                  <button
                    type="button"
                    key={company.id}
                    onClick={() => onSelect(company.id)}
                    className="w-full flex items-center justify-between bg-slate-800/80 border border-white/10 rounded-xl p-4 hover:border-blue-500/50 hover:bg-slate-700/80 transition-all text-left"
                    data-ocid={`company.item.${i + 1}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {company.name}
                        </p>
                        <p className="text-sm text-slate-400">
                          {company.sector}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-xs mt-1 ${roleInfo.color}`}
                        >
                          {roleInfo.label}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
