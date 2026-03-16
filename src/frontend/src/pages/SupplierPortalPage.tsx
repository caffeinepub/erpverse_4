import {
  ArrowLeft,
  Building2,
  LogOut,
  Mail,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";

interface Props {
  onBack: () => void;
}

interface SupplierRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface PurchaseOrder {
  id: string;
  supplier: string; // supplier id
  product?: string;
  amount: number;
  date?: string;
  status: "pending" | "approved" | "delivered" | "cancelled";
}

interface CompanyData {
  companyId: string;
  companyName: string;
  supplier: SupplierRecord;
}

function getOrderStatusColor(status: string): string {
  switch (status) {
    case "delivered":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "approved":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "cancelled":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-amber-100 text-amber-700 border-amber-200";
  }
}

function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Bekliyor",
    approved: "Onaylandı",
    delivered: "Teslim Edildi",
    cancelled: "İptal",
  };
  return labels[status] || status;
}

export default function SupplierPortalPage({ onBack }: Props) {
  const [email, setEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(
    null,
  );
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = () => {
    setLoginError("");
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setLoginError("Lütfen e-posta adresinizi girin.");
      return;
    }

    const found: CompanyData[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("erpverse_purchasing_suppliers_")) continue;
      const companyId = key.replace("erpverse_purchasing_suppliers_", "");
      try {
        const suppliers: SupplierRecord[] = JSON.parse(
          localStorage.getItem(key) || "[]",
        );
        const supplier = suppliers.find(
          (s) => s.email && s.email.trim().toLowerCase() === trimmed,
        );
        if (supplier) {
          const profileKey = `erpverse_company_profile_${companyId}`;
          const profileRaw = localStorage.getItem(profileKey);
          let companyName = companyId;
          if (profileRaw) {
            try {
              const profile = JSON.parse(profileRaw);
              if (profile.name) companyName = profile.name;
            } catch {}
          }
          found.push({ companyId, companyName, supplier });
        }
      } catch {}
    }

    if (found.length === 0) {
      setLoginError("Bu e-posta adresiyle kayıtlı tedarikçi bulunamadı.");
      return;
    }

    if (found.length === 1) {
      setSelectedCompany(found[0]);
      setLoggedIn(true);
    } else {
      setCompanies(found);
    }
  };

  const handleCompanySelect = (company: CompanyData) => {
    setSelectedCompany(company);
    setLoggedIn(true);
  };

  const handlePortalLogout = () => {
    setLoggedIn(false);
    setSelectedCompany(null);
    setCompanies([]);
    setEmail("");
    setLoginError("");
  };

  const getOrders = (): PurchaseOrder[] => {
    if (!selectedCompany) return [];
    const key = `erpverse_purchasing_orders_${selectedCompany.companyId}`;
    try {
      const all: PurchaseOrder[] = JSON.parse(
        localStorage.getItem(key) || "[]",
      );
      return all.filter((o) => o.supplier === selectedCompany.supplier.id);
    } catch {
      return [];
    }
  };

  // ── Company selector (multiple companies) ──
  if (!loggedIn && companies.length > 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Şirket Seçin</h2>
            <p className="text-slate-400 text-sm mt-1">
              Birden fazla şirkette kayıtlısınız
            </p>
          </div>
          <div className="space-y-3">
            {companies.map((c, idx) => (
              <button
                type="button"
                key={c.companyId}
                data-ocid={`supplier_portal.company.item.${idx + 1}`}
                onClick={() => handleCompanySelect(c)}
                className="w-full text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-4 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{c.companyName}</p>
                    <p className="text-slate-400 text-xs">{c.supplier.email}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            className="w-full mt-4 text-slate-400 hover:text-white"
            onClick={handlePortalLogout}
            data-ocid="supplier_portal.back_button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  // ── Portal dashboard ──
  if (loggedIn && selectedCompany) {
    const orders = getOrders();

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-800">Tedarikçi Portalı</h1>
                <p className="text-xs text-slate-500">
                  {selectedCompany.companyName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-700">
                  {selectedCompany.supplier.name}
                </p>
                <p className="text-xs text-slate-400">
                  {selectedCompany.supplier.email}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePortalLogout}
                data-ocid="supplier_portal.logout_button"
                className="border-slate-200 text-slate-600 hover:text-slate-900"
              >
                <LogOut className="w-4 h-4 mr-1.5" /> Çıkış
              </Button>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-5xl mx-auto px-4 py-8">
          {/* Welcome card */}
          <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 p-6 mb-6 text-white">
            <p className="text-sm font-medium opacity-80 mb-1">Hoş geldiniz</p>
            <h2 className="text-2xl font-bold">
              {selectedCompany.supplier.name}
            </h2>
            <div className="flex gap-6 mt-3 text-sm opacity-90">
              <span>🛒 {orders.length} Sipariş</span>
              <span>
                ✅ {orders.filter((o) => o.status === "delivered").length}{" "}
                Teslim Edildi
              </span>
            </div>
          </div>

          {/* Orders */}
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-500" />
            Satın Alma Siparişleri
          </h3>

          {orders.length === 0 ? (
            <div
              data-ocid="supplier_portal.orders.empty_state"
              className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200"
            >
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Sipariş bulunamadı</p>
              <p className="text-sm mt-1">Henüz size ait sipariş kaydı yok.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order, idx) => (
                <Card
                  key={order.id}
                  data-ocid={`supplier_portal.order.item.${idx + 1}`}
                  className="border-slate-200 hover:border-orange-300 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800">
                          {order.product ||
                            `Sipariş #${order.id.slice(-6).toUpperCase()}`}
                        </p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {order.date
                            ? new Date(order.date).toLocaleDateString("tr-TR")
                            : "—"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-slate-900">
                          {Number(order.amount).toLocaleString("tr-TR")} ₺
                        </p>
                        <Badge
                          className={`text-xs mt-1 border ${getOrderStatusColor(order.status)}`}
                        >
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        <footer className="text-center py-6 text-xs text-slate-400">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="text-orange-600 hover:underline"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    );
  }

  // ── Login screen ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-white mb-6"
          onClick={onBack}
          data-ocid="supplier_portal.back_button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Ana Sayfaya Dön
        </Button>

        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Tedarikçi Portalı
            </CardTitle>
            <p className="text-slate-400 text-sm mt-1">
              Sipariş ve sevkiyat durumlarınızı görüntüleyin
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <label
                htmlFor="supplier-portal-email"
                className="text-sm font-medium text-slate-300"
              >
                E-posta Adresi
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="supplier-portal-email"
                  type="email"
                  placeholder="tedarikci@sirket.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-orange-500"
                  data-ocid="supplier_portal.email_input"
                />
              </div>
            </div>

            {loginError && (
              <div
                data-ocid="supplier_portal.error_state"
                className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300"
              >
                {loginError}
              </div>
            )}

            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700 border-0"
              onClick={handleLogin}
              data-ocid="supplier_portal.login_button"
            >
              Giriş Yap
            </Button>

            <p className="text-center text-xs text-slate-500">
              Sistemde kayıtlı e-posta adresinizle giriş yapabilirsiniz.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
