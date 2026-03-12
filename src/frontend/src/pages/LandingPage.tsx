import {
  Building2,
  ChevronRight,
  Globe,
  ShieldCheck,
  UserCircle,
  Users,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import type { PortalType } from "../contexts/AuthContext";
import {
  LANGUAGES,
  type Language,
  useLanguage,
} from "../contexts/LanguageContext";

interface PortalCard {
  type: PortalType;
  titleKey: string;
  descKey: string;
  icon: React.ReactNode;
  gradient: string;
  border: string;
  iconBg: string;
}

const portals: PortalCard[] = [
  {
    type: "owner",
    titleKey: "portal.owner",
    descKey: "portal.owner.desc",
    icon: <Building2 className="w-8 h-8" />,
    gradient: "from-blue-600 to-indigo-700",
    border: "border-blue-500/30",
    iconBg: "bg-blue-500/20",
  },
  {
    type: "manager",
    titleKey: "portal.manager",
    descKey: "portal.manager.desc",
    icon: <Users className="w-8 h-8" />,
    gradient: "from-emerald-500 to-teal-600",
    border: "border-emerald-500/30",
    iconBg: "bg-emerald-500/20",
  },
  {
    type: "admin",
    titleKey: "portal.admin",
    descKey: "portal.admin.desc",
    icon: <ShieldCheck className="w-8 h-8" />,
    gradient: "from-orange-500 to-amber-600",
    border: "border-orange-500/30",
    iconBg: "bg-orange-500/20",
  },
  {
    type: "employee",
    titleKey: "portal.employee",
    descKey: "portal.employee.desc",
    icon: <UserCircle className="w-8 h-8" />,
    gradient: "from-purple-500 to-violet-600",
    border: "border-purple-500/30",
    iconBg: "bg-purple-500/20",
  },
];

interface Props {
  onLogin: (portal: PortalType) => void;
  onRegister: (portal: PortalType) => void;
}

export default function LandingPage({ onLogin, onRegister }: Props) {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              ERPVerse
            </h1>
            <p className="text-xs text-slate-400">{t("landing.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-400" />
          <Select
            value={language}
            onValueChange={(v) => setLanguage(v as Language)}
          >
            <SelectTrigger
              className="w-36 bg-white/10 border-white/20 text-white text-sm"
              data-ocid="lang.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.flag} {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Hero */}
      <div className="text-center py-16 px-4">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-300 text-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          Unified Business Management
        </div>
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
          {t("landing.title")}
        </h2>
        <p className="text-lg text-slate-300 max-w-xl mx-auto">
          {t("landing.description")}
        </p>
      </div>

      {/* Portal Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {portals.map((portal, _i) => (
            <div
              key={portal.type}
              className={`relative rounded-2xl border ${portal.border} bg-slate-800/50 backdrop-blur-sm overflow-hidden group hover:scale-[1.02] transition-all duration-200`}
            >
              {/* Gradient top bar */}
              <div
                className={`h-1 w-full bg-gradient-to-r ${portal.gradient}`}
              />
              <div className="p-6">
                <div
                  className={`w-14 h-14 rounded-xl ${portal.iconBg} flex items-center justify-center text-white mb-4`}
                >
                  {portal.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {t(portal.titleKey)}
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  {t(portal.descKey)}
                </p>
                <div className="space-y-2">
                  <Button
                    className={`w-full bg-gradient-to-r ${portal.gradient} text-white border-0 hover:opacity-90`}
                    onClick={() => onLogin(portal.type)}
                    data-ocid={`landing.${portal.type === "owner" ? "owner" : portal.type === "manager" ? "manager" : portal.type === "admin" ? "admin" : "employee"}_button`}
                  >
                    {t("auth.login")} <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-white/20 text-white bg-white/5 hover:bg-white/10"
                    onClick={() => onRegister(portal.type)}
                    data-ocid={`landing.${portal.type}_register_button`}
                  >
                    {t("auth.register")}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
