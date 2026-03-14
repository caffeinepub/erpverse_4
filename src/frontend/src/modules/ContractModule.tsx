import { FileText, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useAuditLog } from "../contexts/AuditLogContext";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import PaymentScheduleTab from "./PaymentScheduleTab";

type ContractType = "Tedarikci" | "Musteri" | "Calisan" | "Hizmet" | "Diger";
type ContractStatus = "Aktif" | "Taslak" | "SonaErdi" | "Iptal";

interface Contract {
  id: string;
  title: string;
  type: ContractType;
  counterparty: string;
  startDate: string;
  endDate: string;
  value: number;
  status: ContractStatus;
}

export default function ContractModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const companyId = company?.id || "default";
  const { addNotification } = useNotifications();
  const { addLog } = useAuditLog();

  const [contracts, setContracts] = useLocalStorage<Contract[]>(
    `contracts_${companyId}`,
    [],
  );

  const [showDialog, setShowDialog] = useState(false);
  const [filterType, setFilterType] = useState<ContractType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<ContractStatus | "all">(
    "all",
  );
  const [form, setForm] = useState({
    title: "",
    type: "Tedarikci" as ContractType,
    counterparty: "",
    startDate: "",
    endDate: "",
    value: "",
    status: "Taslak" as ContractStatus,
  });

  // Check expiring contracts on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount to notify
  useEffect(() => {
    const today = new Date();
    const in30 = new Date();
    in30.setDate(today.getDate() + 30);
    const expiring = contracts.filter((c) => {
      if (c.status !== "Aktif") return false;
      const end = new Date(c.endDate);
      return end >= today && end <= in30;
    });
    if (expiring.length > 0) {
      addNotification({
        type: "info",
        title: t("contractExpiringSoon"),
        message: expiring.map((c) => c.title).join(", "),
        companyId,
        targetRole: "all",
      });
    }
  }, []);

  const filtered = contracts.filter((c) => {
    const matchType = filterType === "all" || c.type === filterType;
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchType && matchStatus;
  });

  const handleAdd = () => {
    if (!form.title || !form.counterparty || !form.startDate || !form.endDate)
      return;
    const newContract: Contract = {
      id: String(Date.now()),
      title: form.title,
      type: form.type,
      counterparty: form.counterparty,
      startDate: form.startDate,
      endDate: form.endDate,
      value: Number(form.value) || 0,
      status: form.status,
    };
    setContracts((prev) => [...prev, newContract]);
    addLog({
      action: t("addContract"),
      module: "Contracts",
      detail: `${form.title} - ${form.counterparty}`,
    });
    setForm({
      title: "",
      type: "Tedarikci",
      counterparty: "",
      startDate: "",
      endDate: "",
      value: "",
      status: "Taslak",
    });
    setShowDialog(false);
  };

  const handleDelete = (id: string) => {
    const c = contracts.find((x) => x.id === id);
    setContracts((prev) => prev.filter((x) => x.id !== id));
    if (c) {
      addLog({
        action: t("personnel.remove"),
        module: "Contracts",
        detail: c.title,
      });
    }
  };

  const statusColors: Record<ContractStatus, string> = {
    Aktif: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    Taslak: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    SonaErdi: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    Iptal: "bg-red-500/15 text-red-300 border-red-500/30",
  };

  const typeLabels: Record<ContractType, string> = {
    Tedarikci: t("contract.type.supplier"),
    Musteri: t("contract.type.customer"),
    Calisan: t("contract.type.employee"),
    Hizmet: t("contract.type.service"),
    Diger: t("contract.type.other"),
  };

  const statusLabels: Record<ContractStatus, string> = {
    Aktif: t("contract.status.active"),
    Taslak: t("contract.status.draft"),
    SonaErdi: t("contract.status.expired"),
    Iptal: t("contract.status.cancelled"),
  };

  const activeCount = contracts.filter((c) => c.status === "Aktif").length;
  const totalValue = contracts.reduce((s, c) => s + c.value, 0);

  const handleCreateIncomeEntry = (description: string, amount: number) => {
    const key = `erpverse_accounting_${companyId}`;
    let txs: unknown[] = [];
    try {
      txs = JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      txs = [];
    }
    const entry = {
      id: Date.now().toString(),
      type: "income",
      description,
      amount,
      date: new Date().toISOString().slice(0, 10),
      category: "Sözleşme Ödemesi",
    };
    localStorage.setItem(key, JSON.stringify([entry, ...txs]));
  };

  return (
    <div className="p-8">
      <Tabs defaultValue="contracts" className="w-full">
        <TabsList className="bg-slate-800 border border-white/5 mb-6">
          <TabsTrigger
            value="contracts"
            className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-slate-400"
            data-ocid="contracts.contracts.tab"
          >
            {t("contracts")}
          </TabsTrigger>
          <TabsTrigger
            value="payment_schedule"
            className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-slate-400"
            data-ocid="contracts.payment_schedule.tab"
          >
            {t("payment_schedule.payment_schedule")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="contracts">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center">
                <FileText className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {t("contractManagement")}
                </h2>
                <p className="text-slate-400 text-sm">{t("contracts")}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
                <p className="text-slate-400 text-xs mb-1">{t("contracts")}</p>
                <p className="text-2xl font-bold text-white">
                  {contracts.length}
                </p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
                <p className="text-slate-400 text-xs mb-1">
                  {t("contract.status.active")}
                </p>
                <p className="text-2xl font-bold text-emerald-400">
                  {activeCount}
                </p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
                <p className="text-slate-400 text-xs mb-1">
                  {t("contractValue")}
                </p>
                <p className="text-2xl font-bold text-teal-400">
                  ₺{totalValue.toLocaleString("tr-TR")}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-4">
              <Select
                value={filterType}
                onValueChange={(v) => setFilterType(v as ContractType | "all")}
              >
                <SelectTrigger
                  className="bg-slate-800 border-white/10 text-white w-44"
                  data-ocid="contracts.type.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="all" className="text-white">
                    {t("common.all")}
                  </SelectItem>
                  <SelectItem value="Tedarikci" className="text-white">
                    {t("contract.type.supplier")}
                  </SelectItem>
                  <SelectItem value="Musteri" className="text-white">
                    {t("contract.type.customer")}
                  </SelectItem>
                  <SelectItem value="Calisan" className="text-white">
                    {t("contract.type.employee")}
                  </SelectItem>
                  <SelectItem value="Hizmet" className="text-white">
                    {t("contract.type.service")}
                  </SelectItem>
                  <SelectItem value="Diger" className="text-white">
                    {t("contract.type.other")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterStatus}
                onValueChange={(v) =>
                  setFilterStatus(v as ContractStatus | "all")
                }
              >
                <SelectTrigger
                  className="bg-slate-800 border-white/10 text-white w-44"
                  data-ocid="contracts.status.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="all" className="text-white">
                    {t("common.all")}
                  </SelectItem>
                  <SelectItem value="Aktif" className="text-white">
                    {t("contract.status.active")}
                  </SelectItem>
                  <SelectItem value="Taslak" className="text-white">
                    {t("contract.status.draft")}
                  </SelectItem>
                  <SelectItem value="SonaErdi" className="text-white">
                    {t("contract.status.expired")}
                  </SelectItem>
                  <SelectItem value="Iptal" className="text-white">
                    {t("contract.status.cancelled")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="ml-auto">
                <Button
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={() => setShowDialog(true)}
                  data-ocid="contracts.open_modal_button"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t("addContract")}
                </Button>
              </div>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
              <div
                className="text-center py-16 text-slate-500"
                data-ocid="contracts.empty_state"
              >
                {t("common.noData")}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((c, i) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between bg-slate-800 rounded-xl px-5 py-4 border border-white/5"
                    data-ocid={`contracts.item.${i + 1}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {c.title}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {typeLabels[c.type]} · {c.counterparty}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-white text-sm">
                          ₺{c.value.toLocaleString("tr-TR")}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {c.startDate} → {c.endDate}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusColors[c.status]}`}
                      >
                        {statusLabels[c.status]}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        data-ocid={`contracts.delete_button.${i + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogContent
                className="bg-slate-800 border-white/10 text-white max-w-lg"
                data-ocid="contracts.dialog"
              >
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {t("addContract")}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label className="text-slate-300 text-sm mb-1.5 block">
                      {t("contractTitle")}
                    </Label>
                    <Input
                      value={form.title}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, title: e.target.value }))
                      }
                      className="bg-white/10 border-white/20 text-white"
                      data-ocid="contracts.title.input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-300 text-sm mb-1.5 block">
                        {t("contractType")}
                      </Label>
                      <Select
                        value={form.type}
                        onValueChange={(v) =>
                          setForm((p) => ({ ...p, type: v as ContractType }))
                        }
                      >
                        <SelectTrigger
                          className="bg-white/10 border-white/20 text-white"
                          data-ocid="contracts.form.type.select"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/10">
                          <SelectItem value="Tedarikci" className="text-white">
                            {t("contract.type.supplier")}
                          </SelectItem>
                          <SelectItem value="Musteri" className="text-white">
                            {t("contract.type.customer")}
                          </SelectItem>
                          <SelectItem value="Calisan" className="text-white">
                            {t("contract.type.employee")}
                          </SelectItem>
                          <SelectItem value="Hizmet" className="text-white">
                            {t("contract.type.service")}
                          </SelectItem>
                          <SelectItem value="Diger" className="text-white">
                            {t("contract.type.other")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300 text-sm mb-1.5 block">
                        {t("contractStatus")}
                      </Label>
                      <Select
                        value={form.status}
                        onValueChange={(v) =>
                          setForm((p) => ({
                            ...p,
                            status: v as ContractStatus,
                          }))
                        }
                      >
                        <SelectTrigger
                          className="bg-white/10 border-white/20 text-white"
                          data-ocid="contracts.form.status.select"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/10">
                          <SelectItem value="Aktif" className="text-white">
                            {t("contract.status.active")}
                          </SelectItem>
                          <SelectItem value="Taslak" className="text-white">
                            {t("contract.status.draft")}
                          </SelectItem>
                          <SelectItem value="SonaErdi" className="text-white">
                            {t("contract.status.expired")}
                          </SelectItem>
                          <SelectItem value="Iptal" className="text-white">
                            {t("contract.status.cancelled")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm mb-1.5 block">
                      {t("counterparty")}
                    </Label>
                    <Input
                      value={form.counterparty}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, counterparty: e.target.value }))
                      }
                      className="bg-white/10 border-white/20 text-white"
                      data-ocid="contracts.counterparty.input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-300 text-sm mb-1.5 block">
                        {t("startDate")}
                      </Label>
                      <Input
                        type="date"
                        value={form.startDate}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, startDate: e.target.value }))
                        }
                        className="bg-white/10 border-white/20 text-white"
                        data-ocid="contracts.start_date.input"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-sm mb-1.5 block">
                        {t("endDate")}
                      </Label>
                      <Input
                        type="date"
                        value={form.endDate}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, endDate: e.target.value }))
                        }
                        className="bg-white/10 border-white/20 text-white"
                        data-ocid="contracts.end_date.input"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm mb-1.5 block">
                      {t("contractValue")}
                    </Label>
                    <Input
                      type="number"
                      value={form.value}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, value: e.target.value }))
                      }
                      className="bg-white/10 border-white/20 text-white"
                      data-ocid="contracts.value.input"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="ghost"
                    className="text-slate-400"
                    onClick={() => setShowDialog(false)}
                    data-ocid="contracts.cancel_button"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                    onClick={handleAdd}
                    data-ocid="contracts.submit_button"
                  >
                    {t("common.save")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>
        <TabsContent value="payment_schedule">
          <PaymentScheduleTab
            cid={companyId}
            t={t}
            contracts={contracts}
            onCreateIncomeEntry={handleCreateIncomeEntry}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
