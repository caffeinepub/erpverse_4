import { AlertTriangle, Plus, ShieldAlert, Zap } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { useAuditLog } from "../contexts/AuditLogContext";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface Risk {
  id: string;
  title: string;
  category: string;
  probability: number;
  impact: number;
  score: number;
  owner: string;
  status: "open" | "inProgress" | "mitigated" | "closed";
  description: string;
  createdAt: string;
}

interface RiskAction {
  id: string;
  riskId: string;
  action: string;
  responsible: string;
  dueDate: string;
  status: "pending" | "done";
}

const CATEGORIES = ["Operasyonel", "Finansal", "Stratejik", "Uyum", "IT"];

function scoreBg(score: number) {
  if (score >= 15) return "bg-red-500/20 text-red-300 border-red-500/30";
  if (score >= 6) return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
}

function cellBg(score: number) {
  if (score >= 15) return "bg-red-500/20 border-red-500/20";
  if (score >= 6) return "bg-amber-500/20 border-amber-500/20";
  return "bg-emerald-500/20 border-emerald-500/20";
}

export default function RiskModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const { addLog } = useAuditLog();
  const cid = company?.id || "default";

  const [risks, setRisks] = useLocalStorage<Risk[]>(`erpverse_risk_${cid}`, []);
  const [actions, setActions] = useLocalStorage<RiskAction[]>(
    `erpverse_risk_actions_${cid}`,
    [],
  );

  const [showRiskDialog, setShowRiskDialog] = useState(false);
  const [editRiskId, setEditRiskId] = useState<string | null>(null);
  const [riskForm, setRiskForm] = useState({
    title: "",
    category: "Operasyonel",
    probability: "3",
    impact: "3",
    owner: "",
    status: "open" as Risk["status"],
    description: "",
  });

  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionForm, setActionForm] = useState({
    riskId: "",
    action: "",
    responsible: "",
    dueDate: "",
  });

  const openAddRisk = () => {
    setEditRiskId(null);
    setRiskForm({
      title: "",
      category: "Operasyonel",
      probability: "3",
      impact: "3",
      owner: "",
      status: "open",
      description: "",
    });
    setShowRiskDialog(true);
  };

  const openEditRisk = (r: Risk) => {
    setEditRiskId(r.id);
    setRiskForm({
      title: r.title,
      category: r.category,
      probability: String(r.probability),
      impact: String(r.impact),
      owner: r.owner,
      status: r.status,
      description: r.description,
    });
    setShowRiskDialog(true);
  };

  const saveRisk = () => {
    if (!riskForm.title.trim()) return;
    const prob = Number(riskForm.probability);
    const imp = Number(riskForm.impact);
    const score = prob * imp;
    const data: Risk = {
      id: editRiskId || Date.now().toString(),
      title: riskForm.title,
      category: riskForm.category,
      probability: prob,
      impact: imp,
      score,
      owner: riskForm.owner,
      status: riskForm.status,
      description: riskForm.description,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    if (editRiskId) {
      setRisks((prev) => prev.map((r) => (r.id === editRiskId ? data : r)));
      addLog({ module: "Risk", action: "update", detail: riskForm.title });
      toast.success(t("common.updated"));
    } else {
      setRisks((prev) => [...prev, data]);
      addLog({ module: "Risk", action: "create", detail: riskForm.title });
      toast.success(t("common.added"));
    }
    setShowRiskDialog(false);
  };

  const deleteRisk = (id: string) => {
    const r = risks.find((x) => x.id === id);
    setRisks((prev) => prev.filter((x) => x.id !== id));
    setActions((prev) => prev.filter((a) => a.riskId !== id));
    if (r) addLog({ module: "Risk", action: "delete", detail: r.title });
    toast.success(t("common.deleted"));
  };

  const saveAction = () => {
    if (!actionForm.riskId || !actionForm.action.trim()) return;
    const data: RiskAction = {
      id: Date.now().toString(),
      riskId: actionForm.riskId,
      action: actionForm.action,
      responsible: actionForm.responsible,
      dueDate: actionForm.dueDate,
      status: "pending",
    };
    setActions((prev) => [...prev, data]);
    addLog({
      module: "RiskAction",
      action: "create",
      detail: actionForm.action,
    });
    toast.success(t("common.added"));
    setShowActionDialog(false);
    setActionForm({ riskId: "", action: "", responsible: "", dueDate: "" });
  };

  const toggleActionStatus = (id: string) => {
    setActions((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: a.status === "pending" ? "done" : "pending" }
          : a,
      ),
    );
  };

  // Build 5x5 matrix: risks[prob][impact] counts
  const matrixCounts: Record<string, number> = {};
  for (const r of risks) {
    const key = `${r.probability}_${r.impact}`;
    matrixCounts[key] = (matrixCounts[key] || 0) + 1;
  }

  const statusLabels: Record<Risk["status"], string> = {
    open: t("risk.open"),
    inProgress: t("risk.inProgress"),
    mitigated: t("risk.mitigated"),
    closed: t("risk.closed"),
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <ShieldAlert className="w-7 h-7 text-red-400" />
        <h2 className="text-2xl font-bold text-white">{t("risk.title")}</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: t("risk.riskRegister"),
            value: risks.length,
            color: "text-red-400",
            bg: "bg-red-500/10 border-red-500/20",
          },
          {
            label: t("risk.open"),
            value: risks.filter((r) => r.status === "open").length,
            color: "text-orange-400",
            bg: "bg-orange-500/10 border-orange-500/20",
          },
          {
            label: t("risk.inProgress"),
            value: risks.filter((r) => r.status === "inProgress").length,
            color: "text-amber-400",
            bg: "bg-amber-500/10 border-amber-500/20",
          },
          {
            label: t("risk.actions"),
            value: actions.length,
            color: "text-purple-400",
            bg: "bg-purple-500/10 border-purple-500/20",
          },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border rounded-xl p-4`}>
            <p className="text-slate-400 text-xs mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="risks" className="w-full">
        <TabsList className="bg-slate-800 border border-white/5 mb-6">
          <TabsTrigger
            value="risks"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-slate-400"
            data-ocid="risk.risks.tab"
          >
            {t("risk.riskRegister")}
          </TabsTrigger>
          <TabsTrigger
            value="matrix"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-slate-400"
            data-ocid="risk.matrix.tab"
          >
            {t("risk.matrix")}
          </TabsTrigger>
          <TabsTrigger
            value="actions"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-slate-400"
            data-ocid="risk.actions.tab"
          >
            {t("risk.actions")}
          </TabsTrigger>
        </TabsList>

        {/* ---- Riskler Tab ---- */}
        <TabsContent value="risks">
          <div className="flex justify-end mb-4">
            <Button
              onClick={openAddRisk}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-ocid="risk.add_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("risk.addRisk")}
            </Button>
          </div>

          {risks.length === 0 ? (
            <div
              className="text-center py-16 text-slate-500"
              data-ocid="risk.empty_state"
            >
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t("risk.empty")}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-400">
                      {t("risk.riskTitle")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("risk.category")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("risk.probability")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("risk.impact")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("risk.score")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("risk.owner")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("risk.status")}
                    </TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {risks.map((r, idx) => (
                    <TableRow
                      key={r.id}
                      className="border-white/5 hover:bg-white/5"
                      data-ocid={`risk.row.${idx + 1}`}
                    >
                      <TableCell className="text-white font-medium">
                        {r.title}
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {r.category}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-slate-700/50 text-slate-200 border-slate-600"
                        >
                          {r.probability}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-slate-700/50 text-slate-200 border-slate-600"
                        >
                          {r.impact}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={scoreBg(r.score)}>
                          {r.score}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {r.owner}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-slate-700/30 text-slate-300 border-slate-600 text-xs"
                        >
                          {statusLabels[r.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditRisk(r)}
                            className="text-slate-400 hover:text-white"
                            data-ocid={`risk.edit_button.${idx + 1}`}
                          >
                            {t("common.edit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteRisk(r.id)}
                            className="text-red-400 hover:text-red-300"
                            data-ocid={`risk.delete_button.${idx + 1}`}
                          >
                            {t("common.delete")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ---- Matris Tab ---- */}
        <TabsContent value="matrix">
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">
              {t("risk.probability")} (Y) × {t("risk.impact")} (X)
            </p>
            <div className="overflow-auto">
              <div className="inline-block">
                {/* Y axis label */}
                <div className="flex items-end gap-1">
                  <div className="w-16" />
                  {[1, 2, 3, 4, 5].map((imp) => (
                    <div
                      key={imp}
                      className="w-16 text-center text-xs text-slate-400 mb-1"
                    >
                      {t("risk.impact")} {imp}
                    </div>
                  ))}
                </div>
                {[5, 4, 3, 2, 1].map((prob) => (
                  <div key={prob} className="flex items-center gap-1 mb-1">
                    <div className="w-16 text-right pr-2 text-xs text-slate-400">
                      {t("risk.probability")} {prob}
                    </div>
                    {[1, 2, 3, 4, 5].map((imp) => {
                      const score = prob * imp;
                      const count = matrixCounts[`${prob}_${imp}`] || 0;
                      return (
                        <div
                          key={imp}
                          className={`w-16 h-16 flex items-center justify-center rounded border text-sm font-bold ${cellBg(score)}`}
                        >
                          {count > 0 ? (
                            <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-white">
                              {count}
                            </span>
                          ) : (
                            <span className="text-white/20">{score}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            {/* Legend */}
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500/40" />
                <span className="text-xs text-slate-400">1–5 (Düşük)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-500/40" />
                <span className="text-xs text-slate-400">6–14 (Orta)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500/40" />
                <span className="text-xs text-slate-400">15–25 (Yüksek)</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ---- Aksiyonlar Tab ---- */}
        <TabsContent value="actions">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => setShowActionDialog(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-ocid="risk.action.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("risk.addAction")}
            </Button>
          </div>

          {actions.length === 0 ? (
            <div
              className="text-center py-16 text-slate-500"
              data-ocid="risk.actions.empty_state"
            >
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t("risk.actionsEmpty")}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-400">
                      {t("risk.riskTitle")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("risk.action")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("risk.responsible")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("risk.dueDate")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("risk.status")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actions.map((a, idx) => {
                    const risk = risks.find((r) => r.id === a.riskId);
                    return (
                      <TableRow
                        key={a.id}
                        className="border-white/5 hover:bg-white/5"
                        data-ocid={`risk.action.row.${idx + 1}`}
                      >
                        <TableCell className="text-slate-300 text-sm">
                          {risk?.title || "—"}
                        </TableCell>
                        <TableCell className="text-white">{a.action}</TableCell>
                        <TableCell className="text-slate-300 text-sm">
                          {a.responsible}
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm">
                          {a.dueDate}
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => toggleActionStatus(a.id)}
                            data-ocid={`risk.action.toggle.${idx + 1}`}
                          >
                            <Badge
                              variant="outline"
                              className={
                                a.status === "done"
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 cursor-pointer"
                                  : "bg-amber-500/20 text-amber-300 border-amber-500/30 cursor-pointer"
                              }
                            >
                              {a.status === "done"
                                ? "✓ Tamamlandı"
                                : "⏳ Bekliyor"}
                            </Badge>
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Risk Dialog */}
      <Dialog open={showRiskDialog} onOpenChange={setShowRiskDialog}>
        <DialogContent
          className="bg-slate-900 border-white/10 text-white max-w-lg"
          data-ocid="risk.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editRiskId ? t("risk.riskTitle") : t("risk.addRisk")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-slate-300 text-sm">
                {t("risk.riskTitle")}
              </Label>
              <Input
                value={riskForm.title}
                onChange={(e) =>
                  setRiskForm((p) => ({ ...p, title: e.target.value }))
                }
                className="bg-slate-800 border-white/10 text-white mt-1"
                data-ocid="risk.title.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm">
                  {t("risk.category")}
                </Label>
                <Select
                  value={riskForm.category}
                  onValueChange={(v) =>
                    setRiskForm((p) => ({ ...p, category: v }))
                  }
                >
                  <SelectTrigger
                    className="bg-slate-800 border-white/10 text-white mt-1"
                    data-ocid="risk.category.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="text-white">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-sm">
                  {t("risk.status")}
                </Label>
                <Select
                  value={riskForm.status}
                  onValueChange={(v) =>
                    setRiskForm((p) => ({ ...p, status: v as Risk["status"] }))
                  }
                >
                  <SelectTrigger
                    className="bg-slate-800 border-white/10 text-white mt-1"
                    data-ocid="risk.status.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    {(
                      [
                        "open",
                        "inProgress",
                        "mitigated",
                        "closed",
                      ] as Risk["status"][]
                    ).map((s) => (
                      <SelectItem key={s} value={s} className="text-white">
                        {statusLabels[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm">
                  {t("risk.probability")} (1–5)
                </Label>
                <Select
                  value={riskForm.probability}
                  onValueChange={(v) =>
                    setRiskForm((p) => ({ ...p, probability: v }))
                  }
                >
                  <SelectTrigger
                    className="bg-slate-800 border-white/10 text-white mt-1"
                    data-ocid="risk.probability.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem
                        key={n}
                        value={String(n)}
                        className="text-white"
                      >
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-sm">
                  {t("risk.impact")} (1–5)
                </Label>
                <Select
                  value={riskForm.impact}
                  onValueChange={(v) =>
                    setRiskForm((p) => ({ ...p, impact: v }))
                  }
                >
                  <SelectTrigger
                    className="bg-slate-800 border-white/10 text-white mt-1"
                    data-ocid="risk.impact.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem
                        key={n}
                        value={String(n)}
                        className="text-white"
                      >
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-sm">
                {t("risk.owner")}
              </Label>
              <Input
                value={riskForm.owner}
                onChange={(e) =>
                  setRiskForm((p) => ({ ...p, owner: e.target.value }))
                }
                className="bg-slate-800 border-white/10 text-white mt-1"
                data-ocid="risk.owner.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">
                {t("risk.description")}
              </Label>
              <Textarea
                value={riskForm.description}
                onChange={(e) =>
                  setRiskForm((p) => ({ ...p, description: e.target.value }))
                }
                className="bg-slate-800 border-white/10 text-white mt-1"
                rows={3}
                data-ocid="risk.description.textarea"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowRiskDialog(false)}
                data-ocid="risk.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={saveRisk}
                data-ocid="risk.save_button"
              >
                {t("common.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent
          className="bg-slate-900 border-white/10 text-white max-w-md"
          data-ocid="risk.action.dialog"
        >
          <DialogHeader>
            <DialogTitle>{t("risk.addAction")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-slate-300 text-sm">
                {t("risk.riskTitle")}
              </Label>
              <Select
                value={actionForm.riskId}
                onValueChange={(v) =>
                  setActionForm((p) => ({ ...p, riskId: v }))
                }
              >
                <SelectTrigger
                  className="bg-slate-800 border-white/10 text-white mt-1"
                  data-ocid="risk.action.risk.select"
                >
                  <SelectValue placeholder={t("risk.riskTitle")} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {risks.map((r) => (
                    <SelectItem key={r.id} value={r.id} className="text-white">
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm">
                {t("risk.action")}
              </Label>
              <Textarea
                value={actionForm.action}
                onChange={(e) =>
                  setActionForm((p) => ({ ...p, action: e.target.value }))
                }
                className="bg-slate-800 border-white/10 text-white mt-1"
                rows={2}
                data-ocid="risk.action.textarea"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm">
                  {t("risk.responsible")}
                </Label>
                <Input
                  value={actionForm.responsible}
                  onChange={(e) =>
                    setActionForm((p) => ({
                      ...p,
                      responsible: e.target.value,
                    }))
                  }
                  className="bg-slate-800 border-white/10 text-white mt-1"
                  data-ocid="risk.action.responsible.input"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">
                  {t("risk.dueDate")}
                </Label>
                <Input
                  type="date"
                  value={actionForm.dueDate}
                  onChange={(e) =>
                    setActionForm((p) => ({ ...p, dueDate: e.target.value }))
                  }
                  className="bg-slate-800 border-white/10 text-white mt-1"
                  data-ocid="risk.action.duedate.input"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowActionDialog(false)}
                data-ocid="risk.action.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={saveAction}
                data-ocid="risk.action.save_button"
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
