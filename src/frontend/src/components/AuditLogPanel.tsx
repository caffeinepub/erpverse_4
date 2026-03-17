import { ClipboardList } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuditLog } from "../contexts/AuditLogContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const ALL_MODULES = [
  "HR",
  "Accounting",
  "CRM",
  "Inventory",
  "Projects",
  "Purchasing",
  "Production",
  "Workflow",
  "Reporting",
  "Quality",
  "Warehouse",
  "Budget",
  "Assets",
  "CustomerService",
  "Sales",
  "SupplyChain",
  "Maintenance",
  "Payroll",
  "BI",
  "Documents",
  "Risk",
  "Trade",
  "Contracts",
  "Tasks",
  "Calendar",
  "CompanyProfile",
  "Training",
  "ProductCatalog",
  "Automation",
  "PriceLists",
  "WorkOrders",
  "Shifts",
  "Barcode",
  "SerialLot",
  "Approvals",
  "DataExport",
  "Timesheet",
  "CashFlow",
];

export default function AuditLogPanel() {
  const { t } = useLanguage();
  const { logs } = useAuditLog();
  const [filterModule, setFilterModule] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [filterUser, setFilterUser] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map((l) => l.action));
    return Array.from(actions).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (filterModule !== "all" && log.module !== filterModule) return false;
      if (filterAction !== "all" && log.action !== filterAction) return false;
      if (
        filterUser &&
        !log.userName.toLowerCase().includes(filterUser.toLowerCase())
      )
        return false;
      if (dateFrom) {
        const logDate = log.timestamp.slice(0, 10);
        if (logDate < dateFrom) return false;
      }
      if (dateTo) {
        const logDate = log.timestamp.slice(0, 10);
        if (logDate > dateTo) return false;
      }
      return true;
    });
  }, [logs, filterModule, filterAction, filterUser, dateFrom, dateTo]);

  const actionColor = (action: string) => {
    if (action === "create") return "bg-green-500/20 text-green-300";
    if (action === "delete") return "bg-red-500/20 text-red-300";
    if (action === "update") return "bg-blue-500/20 text-blue-300";
    if (action === "approve") return "bg-emerald-500/20 text-emerald-300";
    if (action === "reject") return "bg-rose-500/20 text-rose-300";
    return "bg-slate-700 text-slate-300";
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">
            {t("auditlog.title")}
          </h2>
          <p className="text-slate-400 text-sm">
            {filtered.length} / {logs.length} kayıt
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[180px]">
          <Label className="text-slate-400 text-xs mb-1 block">
            {t("auditlog.filterModule")}
          </Label>
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger
              className="bg-slate-800 border-white/10 text-white h-9"
              data-ocid="auditlog.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/10 max-h-60 overflow-y-auto">
              <SelectItem value="all" className="text-white">
                {t("auditlog.allModules")}
              </SelectItem>
              {ALL_MODULES.map((m) => (
                <SelectItem key={m} value={m} className="text-white">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <Label className="text-slate-400 text-xs mb-1 block">
            İşlem Türü
          </Label>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="bg-slate-800 border-white/10 text-white h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/10">
              <SelectItem value="all" className="text-white">
                Tümü
              </SelectItem>
              {uniqueActions.map((a) => (
                <SelectItem key={a} value={a} className="text-white">
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <Label className="text-slate-400 text-xs mb-1 block">Kullanıcı</Label>
          <Input
            type="text"
            placeholder="Kullanıcı ara..."
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="bg-slate-800 border-white/10 text-white h-9"
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <Label className="text-slate-400 text-xs mb-1 block">
            {t("auditlog.date")} (başlangıç)
          </Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-slate-800 border-white/10 text-white h-9"
            data-ocid="auditlog.input"
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <Label className="text-slate-400 text-xs mb-1 block">
            {t("auditlog.date")} (bitiş)
          </Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-slate-800 border-white/10 text-white h-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="text-center py-16 text-slate-500"
          data-ocid="auditlog.empty_state"
        >
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("auditlog.empty")}</p>
        </div>
      ) : (
        <div
          className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
          data-ocid="auditlog.table"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                  {t("auditlog.date")}
                </th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                  {t("auditlog.user")}
                </th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                  {t("auditlog.module")}
                </th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                  {t("auditlog.action")}
                </th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                  {t("auditlog.detail")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <tr
                  key={log.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/2"
                  data-ocid={`auditlog.row.${i + 1}`}
                >
                  <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString("tr-TR")}
                  </td>
                  <td className="px-5 py-3 text-white text-sm">
                    {log.userName}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionColor(log.action)}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">
                    {log.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
