import { Check, Play, Plus, Trash2, X, Zap } from "lucide-react";
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
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

type TriggerType =
  | "stock_low"
  | "invoice_overdue"
  | "contract_expiring"
  | "task_overdue";
type ActionType = "notify_owner" | "notify_all" | "create_purchase_request";

interface AutomationRule {
  id: string;
  name: string;
  trigger: TriggerType;
  action: ActionType;
  enabled: boolean;
  lastRun?: string;
  lastResult?: "triggered" | "no_match";
}

interface RunLogEntry {
  id: string;
  ruleId: string;
  ruleName: string;
  result: "triggered" | "no_match";
  detail: string;
  runAt: string;
}

function evaluateRules(
  rules: AutomationRule[],
  companyId: string,
  addNotification: ReturnType<typeof useNotifications>["addNotification"],
  t: (k: string) => string,
): RunLogEntry[] {
  const logs: RunLogEntry[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;

    let triggered = false;
    let detail = "";

    if (rule.trigger === "stock_low") {
      try {
        const inv = JSON.parse(
          localStorage.getItem(`erpverse_inventory_${companyId}`) || "[]",
        );
        const lowItems = inv.filter(
          (item: { quantity?: number; minStock?: number; name?: string }) =>
            item.minStock != null &&
            item.quantity != null &&
            item.quantity < item.minStock,
        );
        if (lowItems.length > 0) {
          triggered = true;
          detail = `${lowItems.length} ${t("automation.lowStockDetail")}: ${lowItems.map((i: { name?: string }) => i.name).join(", ")}`;
        } else {
          detail = t("automation.noMatch");
        }
      } catch {
        detail = t("automation.noMatch");
      }
    } else if (rule.trigger === "invoice_overdue") {
      try {
        const invoices = JSON.parse(
          localStorage.getItem(`erpverse_invoices_${companyId}`) || "[]",
        );
        const today = new Date().toISOString().split("T")[0];
        const overdue = invoices.filter(
          (inv: { status?: string; dueDate?: string }) =>
            inv.status !== "paid" && inv.dueDate && inv.dueDate < today,
        );
        if (overdue.length > 0) {
          triggered = true;
          detail = `${overdue.length} ${t("automation.overdueInvoiceDetail")}`;
        } else {
          detail = t("automation.noMatch");
        }
      } catch {
        detail = t("automation.noMatch");
      }
    } else if (rule.trigger === "contract_expiring") {
      try {
        const contracts = JSON.parse(
          localStorage.getItem(`erpverse_contracts_${companyId}`) || "[]",
        );
        const future = new Date();
        future.setDate(future.getDate() + 30);
        const expiring = contracts.filter(
          (c: { endDate?: string; status?: string }) =>
            c.endDate &&
            new Date(c.endDate) <= future &&
            c.status !== "terminated",
        );
        if (expiring.length > 0) {
          triggered = true;
          detail = `${expiring.length} ${t("automation.contractExpiringDetail")}`;
        } else {
          detail = t("automation.noMatch");
        }
      } catch {
        detail = t("automation.noMatch");
      }
    } else if (rule.trigger === "task_overdue") {
      try {
        const tasks = JSON.parse(
          localStorage.getItem(`erpverse_tasks_${companyId}`) || "[]",
        );
        const today = new Date().toISOString().split("T")[0];
        const overdue = tasks.filter(
          (task: { status?: string; dueDate?: string }) =>
            task.status !== "done" && task.dueDate && task.dueDate < today,
        );
        if (overdue.length > 0) {
          triggered = true;
          detail = `${overdue.length} ${t("automation.overdueTaskDetail")}`;
        } else {
          detail = t("automation.noMatch");
        }
      } catch {
        detail = t("automation.noMatch");
      }
    }

    if (triggered) {
      addNotification({
        type: "info",
        title: `⚡ ${rule.name}`,
        message: detail,
        companyId,
        targetRole: rule.action === "notify_owner" ? "owner" : "all",
      });
    }

    logs.push({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      ruleId: rule.id,
      ruleName: rule.name,
      result: triggered ? "triggered" : "no_match",
      detail,
      runAt: new Date().toISOString(),
    });
  }

  return logs;
}

export default function AutomationModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const companyId = company?.id || "default";
  const { addNotification } = useNotifications();

  const [rules, setRules] = useLocalStorage<AutomationRule[]>(
    `erpverse_automation_${companyId}`,
    [],
  );
  const [logs, setLogs] = useLocalStorage<RunLogEntry[]>(
    `erpverse_automation_logs_${companyId}`,
    [],
  );
  const [activeTab, setActiveTab] = useState<"rules" | "log">("rules");
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    name: "",
    trigger: "stock_low" as TriggerType,
    action: "notify_owner" as ActionType,
  });

  const handleAdd = () => {
    if (!form.name) return;
    setRules((prev) => [
      ...prev,
      { id: Date.now().toString(), ...form, enabled: true },
    ]);
    setForm({ name: "", trigger: "stock_low", action: "notify_owner" });
    setShowDialog(false);
  };

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    );
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const runAll = () => {
    const newLogs = evaluateRules(rules, companyId, addNotification, t);
    setLogs((prev) => [...newLogs, ...prev].slice(0, 100));
  };

  const triggerLabel = (trigger: TriggerType) =>
    t(`automation.trigger.${trigger}`);
  const actionLabel = (action: ActionType) => t(`automation.action.${action}`);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center">
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {t("automation.title")}
            </h2>
            <p className="text-slate-400 text-sm">
              {rules.length} {t("automation.rulesCount")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
            onClick={runAll}
            data-ocid="automation.run_button"
          >
            <Play className="w-4 h-4 mr-2" />
            {t("automation.runAll")}
          </Button>
          <Button
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
            onClick={() => setShowDialog(true)}
            data-ocid="automation.open_modal_button"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("automation.addRule")}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800/50 rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("rules")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "rules"
              ? "bg-yellow-600 text-white"
              : "text-slate-400 hover:text-white"
          }`}
          data-ocid="automation.rules.tab"
        >
          {t("automation.rulesTab")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("log")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "log"
              ? "bg-yellow-600 text-white"
              : "text-slate-400 hover:text-white"
          }`}
          data-ocid="automation.log.tab"
        >
          {t("automation.logTab")}
        </button>
      </div>

      {activeTab === "rules" && (
        <div>
          {rules.length === 0 ? (
            <div
              className="text-center py-16 text-slate-500"
              data-ocid="automation.empty_state"
            >
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>{t("automation.noRules")}</p>
            </div>
          ) : (
            <div className="space-y-3" data-ocid="automation.list">
              {rules.map((rule, i) => (
                <div
                  key={rule.id}
                  className="bg-slate-800 rounded-xl border border-white/5 p-4 flex items-center gap-4"
                  data-ocid={`automation.item.${i + 1}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleRule(rule.id)}
                    className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                      rule.enabled ? "bg-yellow-500" : "bg-slate-600"
                    }`}
                    data-ocid={`automation.toggle.${i + 1}`}
                  >
                    <span
                      className={`block w-4 h-4 bg-white rounded-full mx-1 transition-transform ${
                        rule.enabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{rule.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-500/10 text-blue-300 border-blue-500/30"
                      >
                        {triggerLabel(rule.trigger)}
                      </Badge>
                      <span className="text-slate-500 text-xs">→</span>
                      <Badge
                        variant="outline"
                        className="text-xs bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                      >
                        {actionLabel(rule.action)}
                      </Badge>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      rule.enabled
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                    }`}
                  >
                    {rule.enabled
                      ? t("automation.enabled")
                      : t("automation.disabled")}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => deleteRule(rule.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                    data-ocid={`automation.delete_button.${i + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "log" && (
        <div>
          {logs.length === 0 ? (
            <div
              className="text-center py-16 text-slate-500"
              data-ocid="automation.log.empty_state"
            >
              <Play className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>{t("automation.noLogs")}</p>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                      {t("automation.logRule")}
                    </th>
                    <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                      {t("automation.logResult")}
                    </th>
                    <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                      {t("automation.logDetail")}
                    </th>
                    <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                      {t("automation.logTime")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 50).map((entry, i) => (
                    <tr
                      key={entry.id}
                      className="border-b border-white/5 last:border-0"
                      data-ocid={`automation.log.row.${i + 1}`}
                    >
                      <td className="px-5 py-3 text-white text-sm">
                        {entry.ruleName}
                      </td>
                      <td className="px-5 py-3">
                        {entry.result === "triggered" ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-sm">
                            <Check className="w-3 h-3" />{" "}
                            {t("automation.triggered")}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-500 text-sm">
                            <X className="w-3 h-3" /> {t("automation.noMatch")}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-sm max-w-xs truncate">
                        {entry.detail}
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs">
                        {new Date(entry.runAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-md"
          data-ocid="automation.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("automation.addRule")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm">
                {t("automation.ruleName")}
              </Label>
              <Input
                className="bg-slate-700 border-white/10 text-white mt-1"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                data-ocid="automation.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">
                {t("automation.triggerLabel")}
              </Label>
              <Select
                value={form.trigger}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, trigger: v as TriggerType }))
                }
              >
                <SelectTrigger
                  className="bg-slate-700 border-white/10 text-white mt-1"
                  data-ocid="automation.trigger.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-white/10">
                  <SelectItem value="stock_low" className="text-white">
                    {t("automation.trigger.stock_low")}
                  </SelectItem>
                  <SelectItem value="invoice_overdue" className="text-white">
                    {t("automation.trigger.invoice_overdue")}
                  </SelectItem>
                  <SelectItem value="contract_expiring" className="text-white">
                    {t("automation.trigger.contract_expiring")}
                  </SelectItem>
                  <SelectItem value="task_overdue" className="text-white">
                    {t("automation.trigger.task_overdue")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm">
                {t("automation.actionLabel")}
              </Label>
              <Select
                value={form.action}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, action: v as ActionType }))
                }
              >
                <SelectTrigger
                  className="bg-slate-700 border-white/10 text-white mt-1"
                  data-ocid="automation.action.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-white/10">
                  <SelectItem value="notify_owner" className="text-white">
                    {t("automation.action.notify_owner")}
                  </SelectItem>
                  <SelectItem value="notify_all" className="text-white">
                    {t("automation.action.notify_all")}
                  </SelectItem>
                  <SelectItem
                    value="create_purchase_request"
                    className="text-white"
                  >
                    {t("automation.action.create_purchase_request")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowDialog(false)}
                data-ocid="automation.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                onClick={handleAdd}
                data-ocid="automation.submit_button"
              >
                {t("automation.addRule")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
