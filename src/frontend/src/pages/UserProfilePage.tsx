import { Check, Copy, Eye, EyeOff, User } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import type { UserProfile } from "../contexts/AuthContext";
import { type Language, useLanguage } from "../contexts/LanguageContext";

const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: "tr", label: "Turkish", native: "Türkçe" },
  { code: "en", label: "English", native: "English" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "fr", label: "French", native: "Français" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "ru", label: "Russian", native: "Русский" },
  { code: "zh", label: "Chinese", native: "中文" },
];

interface Props {
  user: UserProfile;
  onBack: () => void;
  onUpdateName: (name: string) => void;
}

export default function UserProfilePage({ user, onBack, onUpdateName }: Props) {
  const { t, language, setLanguage } = useLanguage();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [saved, setSaved] = useState(false);
  const [showLoginCode, setShowLoginCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [personnelCopied, setPersonnelCopied] = useState(false);

  const handleSave = () => {
    onUpdateName(displayName);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const copyToClipboard = (text: string, type: "code" | "personnel") => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === "code") {
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      } else {
        setPersonnelCopied(true);
        setTimeout(() => setPersonnelCopied(false), 2000);
      }
    });
  };

  const maskedCode = showLoginCode
    ? user.loginCode
    : user.loginCode.replace(/./g, "•");

  return (
    <div className="min-h-screen bg-slate-950 overflow-auto">
      <div className="sticky top-0 z-10 flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-slate-900/80 backdrop-blur-sm">
        <button
          type="button"
          onClick={onBack}
          className="text-slate-400 hover:text-white flex items-center gap-1.5 text-sm transition-colors"
          data-ocid="profile.back_button"
        >
          ← {t("nav.back")}
        </button>
        <span className="text-slate-600">|</span>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-violet-400" />
          <span className="text-white font-semibold">{t("profile.title")}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-8">
        {/* Avatar / Identity */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-2xl">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-white font-bold text-xl">{user.displayName}</p>
            <p className="text-slate-400 text-sm">
              {t("profile.personnelCode")}:{" "}
              <code className="text-purple-300 font-mono">
                {user.personnelCode}
              </code>
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Display Name */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-white/5">
            <Label className="text-slate-300 text-sm mb-2 block">
              {t("profile.displayName")}
            </Label>
            <div className="flex gap-2">
              <Input
                className="bg-slate-800 border-white/10 text-white flex-1"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                data-ocid="profile.input"
              />
              <Button
                className={`min-w-[90px] transition-colors ${
                  saved
                    ? "bg-emerald-600 hover:bg-emerald-600"
                    : "bg-violet-600 hover:bg-violet-700"
                } text-white`}
                onClick={handleSave}
                disabled={
                  !displayName.trim() || displayName === user.displayName
                }
                data-ocid="profile.save_button"
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    {t("profile.saved")}
                  </>
                ) : (
                  t("profile.save")
                )}
              </Button>
            </div>
          </div>

          {/* Login Code */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-white/5">
            <Label className="text-slate-300 text-sm mb-2 block">
              {t("profile.loginCode")}
            </Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-800 rounded-lg px-4 py-2.5 text-violet-300 font-mono tracking-wider border border-white/5 text-sm">
                {maskedCode}
              </code>
              <Button
                variant="outline"
                size="icon"
                className="border-white/10 text-slate-400 hover:text-white bg-slate-800"
                onClick={() => setShowLoginCode((v) => !v)}
                data-ocid="profile.show_button"
              >
                {showLoginCode ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="border-white/10 text-slate-400 hover:text-white bg-slate-800"
                onClick={() => copyToClipboard(user.loginCode, "code")}
                data-ocid="profile.copy_button"
              >
                {codeCopied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Personnel Code */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-white/5">
            <Label className="text-slate-300 text-sm mb-2 block">
              {t("profile.personnelCode")}
            </Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-800 rounded-lg px-4 py-2.5 text-purple-300 font-mono tracking-widest border border-white/5 text-sm">
                {user.personnelCode}
              </code>
              <Button
                variant="outline"
                size="icon"
                className="border-white/10 text-slate-400 hover:text-white bg-slate-800"
                onClick={() => copyToClipboard(user.personnelCode, "personnel")}
              >
                {personnelCopied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Language */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-white/5">
            <Label className="text-slate-300 text-sm mb-2 block">
              {t("profile.language")}
            </Label>
            <Select
              value={language}
              onValueChange={(v) => setLanguage(v as Language)}
            >
              <SelectTrigger
                className="bg-slate-800 border-white/10 text-white"
                data-ocid="profile.language_select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/10">
                {LANGUAGES.map((lang) => (
                  <SelectItem
                    key={lang.code}
                    value={lang.code}
                    className="text-white"
                  >
                    {lang.native}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
