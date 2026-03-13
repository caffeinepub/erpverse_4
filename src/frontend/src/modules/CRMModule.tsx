import { Handshake, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

type CustomerStatus = "lead" | "active" | "closed";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: CustomerStatus;
}

const STATUS_COLORS: Record<CustomerStatus, string> = {
  lead: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  closed: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export default function CRMModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const companyId = company?.id || "default";
  const [customers, setCustomers] = useLocalStorage<Customer[]>(
    `erpverse_crm_${companyId}`,
    [],
  );
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "all">(
    "all",
  );
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "lead" as CustomerStatus,
  });

  const filtered =
    statusFilter === "all"
      ? customers
      : customers.filter((c) => c.status === statusFilter);

  const handleSave = () => {
    if (!form.name.trim()) return;
    setCustomers((prev) => [...prev, { id: Date.now().toString(), ...form }]);
    setForm({ name: "", email: "", phone: "", company: "", status: "lead" });
    setShowDialog(false);
  };

  const handleDelete = (id: string) =>
    setCustomers((prev) => prev.filter((c) => c.id !== id));

  const handleStatusChange = (
    customerId: string,
    newStatus: CustomerStatus,
  ) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;
    const prevStatus = customer.status;
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, status: newStatus } : c)),
    );

    // CRM->Muhasebe integration: auto-create income when becoming active
    if (prevStatus !== "active" && newStatus === "active") {
      const key = `erpverse_accounting_${companyId}`;
      const existing = (() => {
        try {
          return JSON.parse(localStorage.getItem(key) || "[]");
        } catch {
          return [];
        }
      })();
      const newTx = {
        id: Date.now().toString(),
        type: "income",
        description: `CRM: ${customer.name}`,
        amount: 0,
        date: new Date().toISOString().slice(0, 10),
        category: "CRM",
      };
      localStorage.setItem(key, JSON.stringify([newTx, ...existing]));
      toast.success(t("integration.crmIncomeCreated"));
    }
  };

  const counts = {
    all: customers.length,
    lead: customers.filter((c) => c.status === "lead").length,
    active: customers.filter((c) => c.status === "active").length,
    closed: customers.filter((c) => c.status === "closed").length,
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Handshake className="w-6 h-6 text-orange-400" />
            {t("crm.title")}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {customers.length} {t("crm.customer").toLowerCase()}
          </p>
        </div>
        <Button
          className="bg-orange-600 hover:bg-orange-700 text-white"
          onClick={() => setShowDialog(true)}
          data-ocid="crm.add_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("crm.addCustomer")}
        </Button>
      </div>

      <div className="flex gap-2 mb-5">
        {(["all", "lead", "active", "closed"] as const).map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === s
                ? "bg-orange-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
            data-ocid={`crm.${s}_tab`}
          >
            {s === "all" ? "Tümü" : t(`crm.${s}_status`)} ({counts[s]})
          </button>
        ))}
      </div>

      <div
        className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
        data-ocid="crm.table"
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                {t("crm.customer")}
              </th>
              <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                {t("crm.email")}
              </th>
              <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                {t("crm.phone")}
              </th>
              <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                {t("crm.status")}
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div
                    className="text-center py-12 text-slate-500"
                    data-ocid="crm.empty_state"
                  >
                    <Handshake className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">{t("crm.addCustomer")}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((c, i) => (
                <tr
                  key={c.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/2"
                  data-ocid={`crm.row.${i + 1}`}
                >
                  <td className="px-5 py-3">
                    <p className="text-white font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.company}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-300 text-sm">
                    {c.email}
                  </td>
                  <td className="px-5 py-3 text-slate-300 text-sm">
                    {c.phone}
                  </td>
                  <td className="px-5 py-3">
                    <Select
                      value={c.status}
                      onValueChange={(v) =>
                        handleStatusChange(c.id, v as CustomerStatus)
                      }
                    >
                      <SelectTrigger
                        className={`h-7 text-xs border rounded px-2 w-28 ${STATUS_COLORS[c.status]} border-current bg-transparent`}
                        data-ocid={`crm.status_select.${i + 1}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/10">
                        <SelectItem value="lead" className="text-white text-xs">
                          {t("crm.lead_status")}
                        </SelectItem>
                        <SelectItem
                          value="active"
                          className="text-white text-xs"
                        >
                          {t("crm.active_status")}
                        </SelectItem>
                        <SelectItem
                          value="closed"
                          className="text-white text-xs"
                        >
                          {t("crm.closed_status")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                      data-ocid={`crm.delete_button.${i + 1}`}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-md"
          data-ocid="crm.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("crm.addCustomer")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("crm.customer")}
              </Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                data-ocid="crm.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("crm.email")}
              </Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("crm.phone")}
              </Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("company.name")}
              </Label>
              <Input
                value={form.company}
                onChange={(e) =>
                  setForm((p) => ({ ...p, company: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("crm.status")}
              </Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, status: v as CustomerStatus }))
                }
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="crm.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="lead" className="text-white">
                    {t("crm.lead_status")}
                  </SelectItem>
                  <SelectItem value="active" className="text-white">
                    {t("crm.active_status")}
                  </SelectItem>
                  <SelectItem value="closed" className="text-white">
                    {t("crm.closed_status")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowDialog(false)}
                data-ocid="crm.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                onClick={handleSave}
                data-ocid="crm.save_button"
              >
                {t("common.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
