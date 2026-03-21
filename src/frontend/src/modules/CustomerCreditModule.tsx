import {
  AlertTriangle,
  CreditCard,
  Save,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

interface CRMCustomer {
  id: string;
  name: string;
  company: string;
  email: string;
  status: string;
}

interface CreditLimit {
  limit: number;
  used: number;
}

type CreditLimits = Record<string, CreditLimit>;

function formatCurrency(amount: number): string {
  return `${new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} ₺`;
}

export default function CustomerCreditModule() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const companyId = company?.id ?? "";

  const [customers, setCustomers] = useState<CRMCustomer[]>([]);
  const [creditLimits, setCreditLimits] = useState<CreditLimits>({});
  const [editingLimits, setEditingLimits] = useState<
    Record<string, { limit: string; used: string }>
  >({});
  const [savedRows, setSavedRows] = useState<Record<string, boolean>>({});

  const loadData = useCallback(() => {
    try {
      const raw = localStorage.getItem(`erpverse_crm_customers_${companyId}`);
      const parsed: CRMCustomer[] = raw ? JSON.parse(raw) : [];
      setCustomers(parsed);
    } catch {
      setCustomers([]);
    }

    try {
      const raw = localStorage.getItem(`erpverse_credit_limits_${companyId}`);
      const parsed: CreditLimits = raw ? JSON.parse(raw) : {};
      setCreditLimits(parsed);
      const editing: Record<string, { limit: string; used: string }> = {};
      if (parsed) {
        for (const [id, data] of Object.entries(parsed)) {
          editing[id] = { limit: String(data.limit), used: String(data.used) };
        }
      }
      setEditingLimits(editing);
    } catch {
      setCreditLimits({});
    }
  }, [companyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function getOrInit(customerId: string): { limit: string; used: string } {
    return editingLimits[customerId] ?? { limit: "", used: "" };
  }

  function handleLimitChange(
    customerId: string,
    field: "limit" | "used",
    value: string,
  ) {
    setEditingLimits((prev) => ({
      ...prev,
      [customerId]: { ...getOrInit(customerId), [field]: value },
    }));
    setSavedRows((prev) => ({ ...prev, [customerId]: false }));
  }

  function saveRow(customerId: string) {
    const entry = editingLimits[customerId] ?? { limit: "0", used: "0" };
    const limit = Number.parseFloat(entry.limit) || 0;
    const used = Number.parseFloat(entry.used) || 0;

    const updated: CreditLimits = {
      ...creditLimits,
      [customerId]: { limit, used },
    };
    setCreditLimits(updated);
    localStorage.setItem(
      `erpverse_credit_limits_${companyId}`,
      JSON.stringify(updated),
    );
    setSavedRows((prev) => ({ ...prev, [customerId]: true }));
    setTimeout(
      () => setSavedRows((prev) => ({ ...prev, [customerId]: false })),
      2000,
    );
  }

  function getStatus(
    limit: number,
    used: number,
  ): {
    label: string;
    color: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  } {
    if (limit <= 0)
      return {
        label: t("creditlimit.no_limit") || "Limit Yok",
        color: "text-slate-400",
        variant: "secondary",
      };
    const pct = (used / limit) * 100;
    if (pct > 100)
      return {
        label: t("creditlimit.exceeded") || "Limit Aşıldı",
        color: "text-red-400",
        variant: "destructive",
      };
    if (pct >= 80)
      return {
        label: t("creditlimit.warning") || "Uyarı",
        color: "text-yellow-400",
        variant: "default",
      };
    return {
      label: t("creditlimit.normal") || "Normal",
      color: "text-green-400",
      variant: "default",
    };
  }

  // Summary stats
  const customersWithLimit = customers.filter(
    (c) => (creditLimits[c.id]?.limit ?? 0) > 0,
  );
  const totalExposure = Object.values(creditLimits).reduce(
    (sum, cl) => sum + (cl.limit || 0),
    0,
  );
  const overLimitCount = customers.filter((c) => {
    const cl = creditLimits[c.id];
    return cl && cl.limit > 0 && cl.used > cl.limit;
  }).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-yellow-500/10">
          <CreditCard className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">
            {t("creditlimit.title") || "Müşteri Kredi Limiti"}
          </h2>
          <p className="text-slate-400 text-sm">
            {t("creditlimit.subtitle") ||
              "Müşterilere kredi limiti atayın ve kullanımı takip edin"}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-slate-400 text-xs">
              {t("creditlimit.customers_with_limit") || "Limitli Müşteri"}
            </p>
            <p className="text-2xl font-bold text-white">
              {customersWithLimit.length}
            </p>
          </div>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-slate-400 text-xs">
              {t("creditlimit.total_exposure") || "Toplam Kredi Riski"}
            </p>
            <p className="text-lg font-bold text-white">
              {formatCurrency(totalExposure)}
            </p>
          </div>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-slate-400 text-xs">
              {t("creditlimit.over_limit") || "Limiti Aşan"}
            </p>
            <p className="text-2xl font-bold text-red-400">{overLimitCount}</p>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      {customers.length === 0 ? (
        <div
          data-ocid="creditlimit.empty_state"
          className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-10 text-center"
        >
          <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">
            {t("creditlimit.no_customers") ||
              "CRM'de müşteri bulunmuyor. Önce CRM modülünde müşteri ekleyin."}
          </p>
        </div>
      ) : (
        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">
                    {t("creditlimit.customer") || "Müşteri"}
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">
                    {t("creditlimit.limit_amount") || "Kredi Limiti (₺)"}
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">
                    {t("creditlimit.used_amount") || "Kullanılan (₺)"}
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">
                    {t("creditlimit.remaining") || "Kalan"}
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">
                    {t("creditlimit.usage") || "Kullanım"}
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">
                    {t("creditlimit.status") || "Durum"}
                  </th>
                  <th className="text-right px-4 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">
                    {t("creditlimit.actions") || "İşlem"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {customers.map((customer, idx) => {
                  const editing = getOrInit(customer.id);
                  const savedLimit = Number.parseFloat(editing.limit) || 0;
                  const savedUsed = Number.parseFloat(editing.used) || 0;
                  const remaining = savedLimit - savedUsed;
                  const pct =
                    savedLimit > 0
                      ? Math.min((savedUsed / savedLimit) * 100, 100)
                      : 0;
                  const status = getStatus(savedLimit, savedUsed);

                  return (
                    <tr
                      key={customer.id}
                      data-ocid={`creditlimit.item.${idx + 1}`}
                      className="hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium text-sm">
                            {customer.name}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {customer.company}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          data-ocid={`creditlimit.input.${idx + 1}`}
                          type="number"
                          min="0"
                          value={editing.limit}
                          onChange={(e) =>
                            handleLimitChange(
                              customer.id,
                              "limit",
                              e.target.value,
                            )
                          }
                          placeholder="0"
                          className="bg-slate-700/50 border-slate-600 text-white w-32 h-8 text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min="0"
                          value={editing.used}
                          onChange={(e) =>
                            handleLimitChange(
                              customer.id,
                              "used",
                              e.target.value,
                            )
                          }
                          placeholder="0"
                          className="bg-slate-700/50 border-slate-600 text-white w-32 h-8 text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            remaining < 0
                              ? "text-red-400 font-medium text-sm"
                              : "text-slate-300 text-sm"
                          }
                        >
                          {savedLimit > 0 ? formatCurrency(remaining) : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-28 space-y-1">
                          <Progress value={pct} className="h-2 bg-slate-700" />
                          <p className="text-xs text-slate-400">
                            {savedLimit > 0 ? `${Math.round(pct)}%` : "-"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={status.variant}
                          className={
                            status.label ===
                            (t("creditlimit.exceeded") || "Limit Aşıldı")
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : status.label ===
                                  (t("creditlimit.warning") || "Uyarı")
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                : status.label ===
                                    (t("creditlimit.normal") || "Normal")
                                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                                  : "bg-slate-700/50 text-slate-400 border-slate-600"
                          }
                        >
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          data-ocid={`creditlimit.save_button.${idx + 1}`}
                          size="sm"
                          onClick={() => saveRow(customer.id)}
                          className={
                            savedRows[customer.id]
                              ? "bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                              : "bg-yellow-600 hover:bg-yellow-700 text-white h-8 text-xs"
                          }
                        >
                          <Save className="w-3 h-3 mr-1" />
                          {savedRows[customer.id]
                            ? t("creditlimit.saved") || "Kaydedildi"
                            : t("creditlimit.save") || "Kaydet"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
