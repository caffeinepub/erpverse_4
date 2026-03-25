import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
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
import { useLanguage } from "../contexts/LanguageContext";

interface KeyResult {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
}

interface Objective {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  period: "Aylık" | "Çeyrek" | "Yıllık";
  periodLabel: string;
  status: "Aktif" | "Tamamlandı" | "İptal";
  keyResults: KeyResult[];
  createdAt: string;
}

interface Employee {
  id: string;
  name: string;
  department?: string;
  position?: string;
}

const getCompanyId = () =>
  JSON.parse(localStorage.getItem("erpverse_session") || "{}").companyId ||
  "default";

const STORAGE_KEY = () => `erp_okr_${getCompanyId()}`;

const loadObjectives = (): Objective[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY()) || "[]");
  } catch {
    return [];
  }
};

const saveObjectives = (data: Objective[]) => {
  localStorage.setItem(STORAGE_KEY(), JSON.stringify(data));
};

const loadEmployees = (): Employee[] => {
  try {
    const cid = getCompanyId();
    return JSON.parse(localStorage.getItem(`erpverse_hr_${cid}`) || "[]");
  } catch {
    return [];
  }
};

const calcKRProgress = (kr: KeyResult) =>
  kr.targetValue === 0
    ? 0
    : Math.min(100, Math.round((kr.currentValue / kr.targetValue) * 100));

const calcObjectiveProgress = (obj: Objective) => {
  if (obj.keyResults.length === 0) return 0;
  const sum = obj.keyResults.reduce((acc, kr) => acc + calcKRProgress(kr), 0);
  return Math.round(sum / obj.keyResults.length);
};

const statusColors: Record<Objective["status"], string> = {
  Aktif: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Tamamlandı: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  İptal: "bg-red-500/20 text-red-300 border-red-500/30",
};

const periodColors: Record<Objective["period"], string> = {
  Aylık: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Çeyrek: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Yıllık: "bg-teal-500/20 text-teal-300 border-teal-500/30",
};

const progressBarColor = (pct: number) => {
  if (pct >= 100) return "bg-emerald-500";
  if (pct >= 60) return "bg-blue-500";
  if (pct >= 30) return "bg-amber-500";
  return "bg-red-500";
};

export default function OKRModule() {
  const { t } = useLanguage();
  const [objectives, setObjectives] = useState<Objective[]>(loadObjectives);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingKR, setEditingKR] = useState<{
    objId: string;
    krId: string;
  } | null>(null);
  const [editKRValue, setEditKRValue] = useState("");

  // New objective form
  const [employees] = useState<Employee[]>(loadEmployees);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [objTitle, setObjTitle] = useState("");
  const [period, setPeriod] = useState<Objective["period"]>("Çeyrek");
  const [periodLabel, setPeriodLabel] = useState("");
  const [keyResultDrafts, setKeyResultDrafts] = useState<
    Array<{ id: string; title: string; targetValue: string; unit: string }>
  >([{ id: `krd_${Date.now()}`, title: "", targetValue: "", unit: "%" }]);

  const update = (updated: Objective[]) => {
    setObjectives(updated);
    saveObjectives(updated);
  };

  const addKRDraft = () =>
    setKeyResultDrafts((prev) => [
      ...prev,
      {
        id: `krd_${Date.now()}_${Math.random()}`,
        title: "",
        targetValue: "",
        unit: "%",
      },
    ]);

  const removeKRDraft = (i: number) =>
    setKeyResultDrafts((prev) => prev.filter((_, idx) => idx !== i));

  const saveObjective = () => {
    if (!selectedEmployee || !objTitle.trim() || !periodLabel.trim()) return;
    const emp = employees.find((e) => e.id === selectedEmployee);
    const krs: KeyResult[] = keyResultDrafts
      .filter((k) => k.title.trim())
      .map((k) => ({
        id: `kr_${Date.now()}_${Math.random()}`,
        title: k.title.trim(),
        targetValue: Number(k.targetValue) || 100,
        currentValue: 0,
        unit: k.unit || "%",
      }));
    const obj: Objective = {
      id: `obj_${Date.now()}`,
      employeeId: selectedEmployee,
      employeeName: emp?.name || selectedEmployee,
      title: objTitle.trim(),
      period,
      periodLabel: periodLabel.trim(),
      status: "Aktif",
      keyResults: krs,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    update([...objectives, obj]);
    setSelectedEmployee("");
    setObjTitle("");
    setPeriod("Çeyrek");
    setPeriodLabel("");
    setKeyResultDrafts([
      { id: `krd_${Date.now()}`, title: "", targetValue: "", unit: "%" },
    ]);
  };

  const deleteObjective = (id: string) => {
    update(objectives.filter((o) => o.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const changeStatus = (id: string, status: Objective["status"]) => {
    update(objectives.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const startEditKR = (objId: string, kr: KeyResult) => {
    setEditingKR({ objId, krId: kr.id });
    setEditKRValue(String(kr.currentValue));
  };

  const saveKRValue = () => {
    if (!editingKR) return;
    update(
      objectives.map((o) => {
        if (o.id !== editingKR.objId) return o;
        const updated = {
          ...o,
          keyResults: o.keyResults.map((kr) =>
            kr.id === editingKR.krId
              ? { ...kr, currentValue: Number(editKRValue) || 0 }
              : kr,
          ),
        };
        const prog = calcObjectiveProgress(updated);
        if (prog >= 100 && updated.status === "Aktif") {
          updated.status = "Tamamlandı";
        }
        return updated;
      }),
    );
    setEditingKR(null);
    setEditKRValue("");
  };

  // Summary stats
  const totalCount = objectives.length;
  const activeCount = objectives.filter((o) => o.status === "Aktif").length;
  const avgProgress =
    totalCount === 0
      ? 0
      : Math.round(
          objectives.reduce((sum, o) => sum + calcObjectiveProgress(o), 0) /
            totalCount,
        );

  // Per-employee summary
  const employeeSummary = (() => {
    const map: Record<
      string,
      { name: string; total: number; active: number; avg: number }
    > = {};
    for (const o of objectives) {
      if (!map[o.employeeId]) {
        map[o.employeeId] = {
          name: o.employeeName,
          total: 0,
          active: 0,
          avg: 0,
        };
      }
      map[o.employeeId].total++;
      if (o.status === "Aktif") map[o.employeeId].active++;
    }
    for (const empId of Object.keys(map)) {
      const empObjs = objectives.filter((o) => o.employeeId === empId);
      map[empId].avg =
        empObjs.length === 0
          ? 0
          : Math.round(
              empObjs.reduce((s, o) => s + calcObjectiveProgress(o), 0) /
                empObjs.length,
            );
    }
    return Object.values(map);
  })();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/20 rounded-lg">
          <Target className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{t("okr.title")}</h1>
          <p className="text-sm text-slate-400">{t("okr.subtitle")}</p>
        </div>
      </div>

      <Tabs defaultValue="objectives">
        <TabsList className="bg-slate-800 border border-white/10 mb-6">
          <TabsTrigger
            value="objectives"
            className="data-[state=active]:bg-amber-600"
            data-ocid="okr.objectives.tab"
          >
            <Target className="w-4 h-4 mr-1.5" />
            {t("okr.objectives")}
          </TabsTrigger>
          <TabsTrigger
            value="new"
            className="data-[state=active]:bg-amber-600"
            data-ocid="okr.new.tab"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {t("okr.newObjective")}
          </TabsTrigger>
          <TabsTrigger
            value="summary"
            className="data-[state=active]:bg-amber-600"
            data-ocid="okr.summary.tab"
          >
            <TrendingUp className="w-4 h-4 mr-1.5" />
            {t("okr.summary")}
          </TabsTrigger>
        </TabsList>

        {/* OBJECTIVES TAB */}
        <TabsContent value="objectives">
          {objectives.length === 0 ? (
            <div
              className="text-center py-20 text-slate-400"
              data-ocid="okr.empty_state"
            >
              <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-1">
                {t("okr.noObjectives")}
              </p>
              <p className="text-sm">{t("okr.noObjectivesHint")}</p>
            </div>
          ) : (
            <div className="space-y-4" data-ocid="okr.list">
              {objectives.map((obj, idx) => {
                const prog = calcObjectiveProgress(obj);
                const isExpanded = expandedId === obj.id;
                return (
                  <div
                    key={obj.id}
                    className="bg-slate-800/60 border border-white/10 rounded-xl overflow-hidden"
                    data-ocid={`okr.item.${idx + 1}`}
                  >
                    {/* Objective header */}
                    <div className="p-4 flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-white font-semibold">
                            {obj.employeeName}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded border ${statusColors[obj.status]}`}
                          >
                            {t(`okr.status.${obj.status}`)}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded border ${periodColors[obj.period]}`}
                          >
                            {obj.periodLabel}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm mb-3">
                          {obj.title}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${progressBarColor(prog)}`}
                              style={{ width: `${prog}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">
                            {prog}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {obj.keyResults.length} {t("okr.keyResults")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {obj.status === "Aktif" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => changeStatus(obj.id, "Tamamlandı")}
                            className="text-xs text-emerald-400 hover:text-emerald-300 px-2"
                          >
                            ✓
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : obj.id)
                          }
                          className="text-slate-400 hover:text-white"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteObjective(obj.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          data-ocid={`okr.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Key Results */}
                    {isExpanded && (
                      <div className="border-t border-white/10 p-4 space-y-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {t("okr.keyResultsTitle")}
                        </p>
                        {obj.keyResults.length === 0 ? (
                          <p className="text-slate-500 text-sm">
                            {t("okr.noKRs")}
                          </p>
                        ) : (
                          obj.keyResults.map((kr, kidx) => {
                            const krProg = calcKRProgress(kr);
                            const isEditing =
                              editingKR?.objId === obj.id &&
                              editingKR?.krId === kr.id;
                            return (
                              <div
                                key={kr.id}
                                className="bg-slate-900/50 rounded-lg p-3"
                                data-ocid={`okr.row.${kidx + 1}`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <p className="text-sm text-white font-medium">
                                    {kr.title}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      isEditing
                                        ? setEditingKR(null)
                                        : startEditKR(obj.id, kr)
                                    }
                                    className="text-amber-400 hover:text-amber-300 p-1 h-auto shrink-0"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="flex-1 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${progressBarColor(krProg)}`}
                                      style={{ width: `${krProg}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-400 whitespace-nowrap">
                                    {kr.currentValue} / {kr.targetValue}{" "}
                                    {kr.unit} ({krProg}%)
                                  </span>
                                </div>
                                {isEditing && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <Input
                                      type="number"
                                      value={editKRValue}
                                      onChange={(e) =>
                                        setEditKRValue(e.target.value)
                                      }
                                      className="bg-slate-800 border-white/10 text-white h-8 text-sm w-32"
                                      data-ocid="okr.kr_value.input"
                                    />
                                    <span className="text-xs text-slate-400">
                                      {kr.unit}
                                    </span>
                                    <Button
                                      size="sm"
                                      onClick={saveKRValue}
                                      className="bg-amber-600 hover:bg-amber-700 h-8 text-xs"
                                      data-ocid="okr.kr_save.button"
                                    >
                                      {t("common.save")}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingKR(null)}
                                      className="text-slate-400 h-8 text-xs"
                                    >
                                      {t("common.cancel")}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}

                        {/* Status actions */}
                        <div className="flex gap-2 pt-1">
                          {obj.status !== "Tamamlandı" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => changeStatus(obj.id, "Tamamlandı")}
                              className="text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                            >
                              {t("okr.markDone")}
                            </Button>
                          )}
                          {obj.status === "Aktif" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => changeStatus(obj.id, "İptal")}
                              className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              {t("okr.cancel")}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* NEW OBJECTIVE TAB */}
        <TabsContent value="new">
          <div className="bg-slate-800/60 border border-white/10 rounded-xl p-6 max-w-2xl space-y-5">
            <h2 className="text-white font-semibold text-lg">
              {t("okr.newObjective")}
            </h2>

            <div>
              <Label className="text-slate-300 text-sm">
                {t("okr.employee")}
              </Label>
              <Select
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
              >
                <SelectTrigger
                  className="mt-1 bg-slate-900 border-white/10 text-white"
                  data-ocid="okr.employee.select"
                >
                  <SelectValue placeholder={t("okr.selectEmployee")} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10 text-white">
                  {employees.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      {t("okr.noEmployeesFound")}
                    </SelectItem>
                  ) : (
                    employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                        {emp.department ? ` – ${emp.department}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300 text-sm">
                {t("okr.objectiveTitle")}
              </Label>
              <Input
                className="mt-1 bg-slate-900 border-white/10 text-white"
                value={objTitle}
                onChange={(e) => setObjTitle(e.target.value)}
                placeholder={t("okr.objectivePlaceholder")}
                data-ocid="okr.title.input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300 text-sm">
                  {t("okr.period")}
                </Label>
                <Select
                  value={period}
                  onValueChange={(v) => setPeriod(v as Objective["period"])}
                >
                  <SelectTrigger
                    className="mt-1 bg-slate-900 border-white/10 text-white"
                    data-ocid="okr.period.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10 text-white">
                    <SelectItem value="Aylık">{t("okr.monthly")}</SelectItem>
                    <SelectItem value="Çeyrek">{t("okr.quarterly")}</SelectItem>
                    <SelectItem value="Yıllık">{t("okr.yearly")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-sm">
                  {t("okr.periodLabel")}
                </Label>
                <Input
                  className="mt-1 bg-slate-900 border-white/10 text-white"
                  value={periodLabel}
                  onChange={(e) => setPeriodLabel(e.target.value)}
                  placeholder="ör. Q1 2026, Ocak 2026"
                  data-ocid="okr.period_label.input"
                />
              </div>
            </div>

            {/* Key Results */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-sm font-semibold">
                  {t("okr.keyResultsTitle")}
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addKRDraft}
                  className="text-xs border-white/10 text-slate-300 hover:bg-slate-700"
                  data-ocid="okr.add_kr.button"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {t("okr.addKR")}
                </Button>
              </div>
              {keyResultDrafts.map((kr, i) => (
                <div
                  key={kr.id}
                  className="bg-slate-900/60 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-400 font-bold w-8 shrink-0">
                      KR{i + 1}
                    </span>
                    <Input
                      className="flex-1 bg-slate-800 border-white/10 text-white text-sm h-8"
                      placeholder={t("okr.krTitlePlaceholder")}
                      value={kr.title}
                      onChange={(e) =>
                        setKeyResultDrafts((prev) =>
                          prev.map((k, idx) =>
                            idx === i ? { ...k, title: e.target.value } : k,
                          ),
                        )
                      }
                    />
                    {keyResultDrafts.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeKRDraft(i)}
                        className="text-red-400 hover:text-red-300 p-1 h-8"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-8">
                    <Input
                      type="number"
                      className="w-28 bg-slate-800 border-white/10 text-white text-sm h-8"
                      placeholder={t("okr.target")}
                      value={kr.targetValue}
                      onChange={(e) =>
                        setKeyResultDrafts((prev) =>
                          prev.map((k, idx) =>
                            idx === i
                              ? { ...k, targetValue: e.target.value }
                              : k,
                          ),
                        )
                      }
                    />
                    <Input
                      className="w-24 bg-slate-800 border-white/10 text-white text-sm h-8"
                      placeholder={t("okr.unit")}
                      value={kr.unit}
                      onChange={(e) =>
                        setKeyResultDrafts((prev) =>
                          prev.map((k, idx) =>
                            idx === i ? { ...k, unit: e.target.value } : k,
                          ),
                        )
                      }
                    />
                    <span className="text-xs text-slate-500">
                      %, adet, TL ...
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={saveObjective}
              className="bg-amber-600 hover:bg-amber-700 text-white w-full"
              data-ocid="okr.save.button"
            >
              {t("okr.save")}
            </Button>
          </div>
        </TabsContent>

        {/* SUMMARY TAB */}
        <TabsContent value="summary">
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-800/60 border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-5 h-5 text-amber-400" />
                  <span className="text-slate-400 text-sm">
                    {t("okr.totalObjectives")}
                  </span>
                </div>
                <p className="text-3xl font-bold text-white">{totalCount}</p>
              </div>
              <div className="bg-slate-800/60 border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span className="text-slate-400 text-sm">
                    {t("okr.activeObjectives")}
                  </span>
                </div>
                <p className="text-3xl font-bold text-blue-400">
                  {activeCount}
                </p>
              </div>
              <div className="bg-slate-800/60 border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span className="text-slate-400 text-sm">
                    {t("okr.avgProgress")}
                  </span>
                </div>
                <p className="text-3xl font-bold text-emerald-400">
                  {avgProgress}%
                </p>
                <Progress value={avgProgress} className="h-1.5 mt-3" />
              </div>
            </div>

            {/* Per-employee table */}
            {employeeSummary.length === 0 ? (
              <div
                className="text-center py-12 text-slate-400"
                data-ocid="okr.summary.empty_state"
              >
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>{t("okr.noData")}</p>
              </div>
            ) : (
              <div
                className="rounded-xl border border-white/10 overflow-hidden"
                data-ocid="okr.summary.table"
              >
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-slate-400">
                        {t("okr.employee")}
                      </TableHead>
                      <TableHead className="text-slate-400 text-center">
                        {t("okr.totalObjectives")}
                      </TableHead>
                      <TableHead className="text-slate-400 text-center">
                        {t("okr.activeObjectives")}
                      </TableHead>
                      <TableHead className="text-slate-400">
                        {t("okr.avgProgress")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeSummary.map((emp, i) => (
                      <TableRow
                        key={emp.name}
                        className="border-white/10"
                        data-ocid={`okr.summary.item.${i + 1}`}
                      >
                        <TableCell className="text-white font-medium">
                          {emp.name}
                        </TableCell>
                        <TableCell className="text-center text-slate-300">
                          {emp.total}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            {emp.active}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${progressBarColor(emp.avg)}`}
                                style={{ width: `${emp.avg}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-300 w-10 text-right">
                              {emp.avg}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
