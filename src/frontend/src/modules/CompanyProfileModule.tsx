import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building,
  DollarSign,
  FileText,
  Globe,
  Image,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";

interface CompanyProfile {
  logoUrl: string;
  name: string;
  address: string;
  city: string;
  country: string;
  taxNumber: string;
  email: string;
  phone: string;
  website: string;
}

interface ExchangeRates {
  USD: number;
  EUR: number;
  GBP: number;
}

const defaultProfile: CompanyProfile = {
  logoUrl: "",
  name: "",
  address: "",
  city: "",
  country: "",
  taxNumber: "",
  email: "",
  phone: "",
  website: "",
};

const defaultRates: ExchangeRates = { USD: 32, EUR: 35, GBP: 40 };

export default function CompanyProfileModule() {
  const { t } = useLanguage();
  const session = JSON.parse(localStorage.getItem("erpverse_session") || "{}");
  const companyId = session.companyId;
  const storageKey = `erpverse_company_profile_${companyId}`;

  const [profile, setProfile] = useState<CompanyProfile>(defaultProfile);
  const [rates, setRates] = useState<ExchangeRates>(defaultRates);

  useEffect(() => {
    if (!companyId) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setProfile(JSON.parse(saved));
    } catch {}
    try {
      const savedRates = localStorage.getItem("erp_exchange_rates");
      if (savedRates) setRates(JSON.parse(savedRates));
    } catch {}
  }, [companyId, storageKey]);

  const handleChange = (field: keyof CompanyProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!companyId) return;
    localStorage.setItem(storageKey, JSON.stringify(profile));
    toast.success(t("companyProfile.saved"));
  };

  const handleSaveRates = () => {
    localStorage.setItem("erp_exchange_rates", JSON.stringify(rates));
    toast.success(t("saveRates"));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        <Building className="w-6 h-6 text-blue-400" />
        {t("companyProfile.title")}
      </h2>

      <Card className="bg-slate-800 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-base">
            {t("companyProfile.logo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt="Logo"
                className="w-16 h-16 rounded-lg object-cover border border-white/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center border border-white/20">
                <Image className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <div className="flex-1">
              <Label className="text-slate-300 text-sm">
                {t("companyProfile.logo")}
              </Label>
              <Input
                data-ocid="companyprofile.input"
                value={profile.logoUrl}
                onChange={(e) => handleChange("logoUrl", e.target.value)}
                placeholder="https://example.com/logo.png"
                className="mt-1 bg-slate-700 border-white/20 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-white/10">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300 text-sm flex items-center gap-1">
                <Building className="w-3 h-3" /> {t("dashboard.companyName")}
              </Label>
              <Input
                data-ocid="companyprofile.name.input"
                value={profile.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="mt-1 bg-slate-700 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm flex items-center gap-1">
                <FileText className="w-3 h-3" /> {t("companyProfile.taxNumber")}
              </Label>
              <Input
                data-ocid="companyprofile.taxnumber.input"
                value={profile.taxNumber}
                onChange={(e) => handleChange("taxNumber", e.target.value)}
                className="mt-1 bg-slate-700 border-white/20 text-white"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-slate-300 text-sm flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {t("companyProfile.address")}
              </Label>
              <Input
                data-ocid="companyprofile.address.input"
                value={profile.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className="mt-1 bg-slate-700 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">
                {t("companyProfile.city")}
              </Label>
              <Input
                data-ocid="companyprofile.city.input"
                value={profile.city}
                onChange={(e) => handleChange("city", e.target.value)}
                className="mt-1 bg-slate-700 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">
                {t("companyProfile.country")}
              </Label>
              <Input
                data-ocid="companyprofile.country.input"
                value={profile.country}
                onChange={(e) => handleChange("country", e.target.value)}
                className="mt-1 bg-slate-700 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm flex items-center gap-1">
                <Mail className="w-3 h-3" /> {t("companyProfile.email")}
              </Label>
              <Input
                data-ocid="companyprofile.email.input"
                type="email"
                value={profile.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="mt-1 bg-slate-700 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm flex items-center gap-1">
                <Phone className="w-3 h-3" /> {t("companyProfile.phone")}
              </Label>
              <Input
                data-ocid="companyprofile.phone.input"
                value={profile.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="mt-1 bg-slate-700 border-white/20 text-white"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-slate-300 text-sm flex items-center gap-1">
                <Globe className="w-3 h-3" /> {t("companyProfile.website")}
              </Label>
              <Input
                data-ocid="companyprofile.website.input"
                value={profile.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://"
                className="mt-1 bg-slate-700 border-white/20 text-white"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              data-ocid="companyprofile.save_button"
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {t("companyProfile.save")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rates */}
      <Card className="bg-slate-800 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            {t("exchangeRates")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("usdRate")}
              </Label>
              <Input
                data-ocid="exchange_rates.usd_input"
                type="number"
                value={rates.USD}
                onChange={(e) =>
                  setRates((p) => ({ ...p, USD: Number(e.target.value) }))
                }
                className="bg-slate-700 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("eurRate")}
              </Label>
              <Input
                data-ocid="exchange_rates.eur_input"
                type="number"
                value={rates.EUR}
                onChange={(e) =>
                  setRates((p) => ({ ...p, EUR: Number(e.target.value) }))
                }
                className="bg-slate-700 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("gbpRate")}
              </Label>
              <Input
                data-ocid="exchange_rates.gbp_input"
                type="number"
                value={rates.GBP}
                onChange={(e) =>
                  setRates((p) => ({ ...p, GBP: Number(e.target.value) }))
                }
                className="bg-slate-700 border-white/20 text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Button
              data-ocid="exchange_rates.save_button"
              onClick={handleSaveRates}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {t("saveRates")}
            </Button>
            <p className="text-slate-500 text-xs">
              1 USD = {rates.USD} ₺ &nbsp;|&nbsp; 1 EUR = {rates.EUR} ₺
              &nbsp;|&nbsp; 1 GBP = {rates.GBP} ₺
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
