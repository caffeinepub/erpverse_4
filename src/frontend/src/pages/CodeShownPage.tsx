import { Check, CheckCircle, Copy, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { useLanguage } from "../contexts/LanguageContext";

interface Props {
  loginCode: string;
  personnelCode: string;
  onContinue: () => void;
}

export default function CodeShownPage({
  loginCode,
  personnelCode,
  onContinue,
}: Props) {
  const { t } = useLanguage();
  const [copiedLogin, setCopiedLogin] = useState(false);
  const [copiedPersonnel, setCopiedPersonnel] = useState(false);

  const copyCode = async (code: string, type: "login" | "personnel") => {
    await navigator.clipboard.writeText(code);
    if (type === "login") {
      setCopiedLogin(true);
      setTimeout(() => setCopiedLogin(false), 2000);
    } else {
      setCopiedPersonnel(true);
      setTimeout(() => setCopiedPersonnel(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {t("code.title")}
          </h2>
          <p className="text-slate-400 text-sm">{t("code.subtitle")}</p>
        </div>

        <div className="space-y-4 mb-6">
          {/* Login Code */}
          <div className="bg-slate-800/80 border border-blue-500/30 rounded-xl p-5">
            <p className="text-sm text-slate-400 mb-2">{t("code.loginCode")}</p>
            <div className="flex items-center justify-between gap-3">
              <code className="text-2xl font-mono font-bold text-blue-300 tracking-widest">
                {loginCode}
              </code>
              <button
                type="button"
                onClick={() => copyCode(loginCode, "login")}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2"
                data-ocid="code.copy_button"
              >
                {copiedLogin ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copiedLogin ? t("code.copied") : t("code.copy")}
              </button>
            </div>
          </div>

          {/* Personnel Code */}
          <div className="bg-slate-800/80 border border-purple-500/30 rounded-xl p-5">
            <p className="text-sm text-slate-400 mb-2">
              {t("code.personnelCode")}
            </p>
            <div className="flex items-center justify-between gap-3">
              <code className="text-xl font-mono font-bold text-purple-300 tracking-widest">
                {personnelCode}
              </code>
              <button
                type="button"
                onClick={() => copyCode(personnelCode, "personnel")}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2"
                data-ocid="personnel_code.copy_button"
              >
                {copiedPersonnel ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copiedPersonnel ? t("code.copied") : t("code.copy")}
              </button>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-200">{t("code.subtitle")}</p>
        </div>

        <Button
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-0 hover:opacity-90 h-11 text-base"
          onClick={onContinue}
        >
          {t("code.continue")}
        </Button>
      </div>
    </div>
  );
}
