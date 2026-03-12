import { AlertCircle, ArrowLeft, Building2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import type { PortalType } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useActor } from "../hooks/useActor";

interface Props {
  mode: "register" | "login";
  portalType: PortalType;
  onBack: () => void;
  onRegistered: (data: {
    loginCode: string;
    personnelCode: string;
    displayName: string;
  }) => void;
  onLoggedIn: (userId: string) => void;
}

const portalColors: Record<PortalType, string> = {
  owner: "from-blue-600 to-indigo-700",
  manager: "from-emerald-500 to-teal-600",
  admin: "from-orange-500 to-amber-600",
  employee: "from-purple-500 to-violet-600",
};

export default function AuthPage({
  mode,
  portalType,
  onBack,
  onRegistered,
  onLoggedIn,
}: Props) {
  const { t } = useLanguage();
  const { actor } = useActor();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const portalTitleKey = `portal.${portalType}`;
  const gradient = portalColors[portalType];

  const handleSubmit = async () => {
    if (!actor || !value.trim()) return;
    setLoading(true);
    setError("");
    try {
      if (mode === "register") {
        const result = await actor.registerUser(value.trim());
        if (!result || result.length === 0) {
          setError(t("common.error"));
          return;
        }
        const profile = result[0];
        onRegistered({
          loginCode: profile.loginCode,
          personnelCode: profile.personnelCode,
          displayName: profile.displayName,
        });
      } else {
        const result = await actor.loginWithCode(value.trim().toUpperCase());
        if (!result || result.length === 0) {
          setError(`${t("common.error")} - ${t("auth.loginCode")}`);
          return;
        }
        onLoggedIn(result[0].id);
      }
    } catch (_e) {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <header className="flex items-center px-6 py-4 border-b border-white/10">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          data-ocid="nav.back_button"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t("nav.back")}</span>
        </button>
        <div className="flex items-center gap-2 mx-auto">
          <Building2 className="w-5 h-5 text-white" />
          <span className="text-white font-semibold">ERPVerse</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Portal badge */}
          <div
            className={`inline-flex items-center gap-2 bg-gradient-to-r ${gradient} rounded-full px-4 py-1.5 text-white text-sm font-medium mb-6`}
          >
            {t(portalTitleKey)}
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">
            {mode === "register" ? t("auth.register") : t("auth.login")}
          </h2>
          <p className="text-slate-400 mb-8">
            {t(`portal.${portalType}.desc`)}
          </p>

          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 mb-2 block">
                {mode === "register" ? t("auth.fullName") : t("auth.loginCode")}
              </Label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={
                  mode === "register"
                    ? t("auth.enterName")
                    : t("auth.enterCode")
                }
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-lg tracking-widest"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                data-ocid={
                  mode === "register"
                    ? "auth.register_input"
                    : "auth.login_input"
                }
                autoCapitalize="characters"
              />
            </div>

            {error && (
              <div
                className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                data-ocid="auth.error_state"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              className={`w-full bg-gradient-to-r ${gradient} text-white border-0 hover:opacity-90 h-11 text-base`}
              onClick={handleSubmit}
              disabled={loading || !value.trim()}
              data-ocid="auth.submit_button"
            >
              {loading ? t("common.loading") : t("auth.submit")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
