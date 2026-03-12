import { ArrowLeft, Building2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useLanguage } from "../contexts/LanguageContext";
import { useActor } from "../hooks/useActor";

interface Props {
  userId: string;
  onCreated: (companyId: string) => void;
  onBack: () => void;
}

export default function CompanySetupPage({ userId, onCreated, onBack }: Props) {
  const { t } = useLanguage();
  const { actor } = useActor();
  const [form, setForm] = useState({
    name: "",
    sector: "",
    address: "",
    email: "",
    phone: "",
    foundedYear: new Date().getFullYear().toString(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!actor || !form.name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await actor.registerCompany(
        userId,
        form.name,
        form.sector,
        form.address,
        form.email,
        form.phone,
        form.foundedYear,
      );
      if (!result || result.length === 0) {
        setError(t("common.error"));
        return;
      }
      onCreated(result[0].id);
    } catch (_e) {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const fields: { key: keyof typeof form; labelKey: string; type?: string }[] =
    [
      { key: "name", labelKey: "company.name" },
      { key: "sector", labelKey: "company.sector" },
      { key: "address", labelKey: "company.address" },
      { key: "email", labelKey: "company.email", type: "email" },
      { key: "phone", labelKey: "company.phone", type: "tel" },
      { key: "foundedYear", labelKey: "company.foundedYear", type: "number" },
    ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="flex items-center px-6 py-4 border-b border-white/10">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t("nav.back")}</span>
        </button>
        <div className="flex items-center gap-2 mx-auto">
          <Building2 className="w-5 h-5 text-white" />
          <span className="text-white font-semibold">ERPVerse</span>
        </div>
      </header>

      <div className="flex items-center justify-center p-6 min-h-[calc(100vh-73px)]">
        <div className="w-full max-w-lg">
          <div className="w-14 h-14 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-6">
            <Building2 className="w-7 h-7 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {t("company.setup.title")}
          </h2>
          <p className="text-slate-400 mb-8">{t("company.setup.subtitle")}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {fields.map((f) => (
              <div
                key={f.key}
                className={f.key === "address" ? "sm:col-span-2" : ""}
              >
                <Label className="text-slate-300 mb-1.5 block text-sm">
                  {t(f.labelKey)}
                </Label>
                <Input
                  type={f.type || "text"}
                  value={form[f.key]}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                  data-ocid={`company.${f.key}_input`}
                />
              </div>
            ))}
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-0 hover:opacity-90 h-11 text-base"
            onClick={handleSubmit}
            disabled={loading || !form.name.trim()}
            data-ocid="company.submit_button"
          >
            {loading ? t("common.loading") : t("company.create")}
          </Button>
        </div>
      </div>
    </div>
  );
}
