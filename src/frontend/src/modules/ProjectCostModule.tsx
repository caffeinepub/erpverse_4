import {
  BarChart3,
  BookOpen,
  CheckCircle,
  DollarSign,
  Plus,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/badge";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useLanguage } from "../contexts/LanguageContext";

interface Project {
  id: string;
  name: string;
  status: string;
}

interface CostEntry {
  id: string;
  projectId: string;
  type: "labor" | "material" | "overhead";
  description: string;
  amount: number;
  date: string;
  createdAt: string;
}

interface BudgetConfig {
  budget: number;
  hourlyRate: number;
}

interface Timesheet {
  id: string;
  projectId: string;
  hours: number;
}

export default function ProjectCostModule() {
  const { t } = useLanguage();
  const companyId = localStorage.getItem("erpverse_selected_company") || "";

  const BUDGETS_KEY = `erpverse_projectcost_budgets_${companyId}`;
  const ENTRIES_KEY = `erpverse_projectcost_entries_${companyId}`;
  const PROJECTS_KEY = `erpverse_projects_${companyId}`;
  const TIMESHEETS_KEY = `erpverse_timesheets_${companyId}`;
  const ACCOUNTING_KEY = `erpverse_accounting_${companyId}`;

  const getProjects = (): Project[] => {
    try {
      return JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
    } catch {
      return [];
    }
  };

  const getBudgets = (): Record<string, BudgetConfig> => {
    try {
      return JSON.parse(localStorage.getItem(BUDGETS_KEY) || "{}");
    } catch {
      return {};
    }
  };

  const getEntries = (): CostEntry[] => {
    try {
      return JSON.parse(localStorage.getItem(ENTRIES_KEY) || "[]");
    } catch {
      return [];
    }
  };

  const getTimesheets = (): Timesheet[] => {
    try {
      return JSON.parse(localStorage.getItem(TIMESHEETS_KEY) || "[]");
    } catch {
      return [];
    }
  };

  const projects = getProjects();
  const [budgets, setBudgetsState] =
    useState<Record<string, BudgetConfig>>(getBudgets);
  const [entries, setEntriesState] = useState<CostEntry[]>(getEntries);
  const [sentProjects, setSentProjects] = useState<Set<string>>(new Set());

  // Budget editor state
  const [editBudget, setEditBudget] = useState<
    Record<string, { budget: string; hourlyRate: string }>
  >({});

  // New entry form
  const [form, setForm] = useState({
    projectId: "",
    type: "material" as CostEntry["type"],
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  const saveBudgets = (updated: Record<string, BudgetConfig>) => {
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(updated));
    setBudgetsState(updated);
  };

  const saveEntries = (updated: CostEntry[]) => {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(updated));
    setEntriesState(updated);
  };

  const getProjectStats = (projectId: string) => {
    const cfg = budgets[projectId] || { budget: 0, hourlyRate: 100 };
    const timesheets = getTimesheets();
    const totalHours = timesheets
      .filter((ts) => ts.projectId === projectId)
      .reduce((sum, ts) => sum + (ts.hours || 0), 0);
    const laborCost = totalHours * (cfg.hourlyRate || 100);
    const manualCost = entries
      .filter((e) => e.projectId === projectId)
      .reduce((sum, e) => sum + e.amount, 0);
    const totalCost = laborCost + manualCost;
    const profit = cfg.budget - totalCost;
    return {
      budget: cfg.budget,
      hourlyRate: cfg.hourlyRate || 100,
      totalHours,
      laborCost,
      manualCost,
      totalCost,
      profit,
    };
  };

  const handleSetBudget = (projectId: string) => {
    const vals = editBudget[projectId];
    if (!vals) return;
    const updated = {
      ...budgets,
      [projectId]: {
        budget: Number.parseFloat(vals.budget) || 0,
        hourlyRate: Number.parseFloat(vals.hourlyRate) || 100,
      },
    };
    saveBudgets(updated);
    setEditBudget((prev) => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
  };

  const handleAddEntry = () => {
    if (!form.projectId || !form.description || !form.amount) return;
    const entry: CostEntry = {
      id: Date.now().toString(),
      projectId: form.projectId,
      type: form.type,
      description: form.description,
      amount: Number.parseFloat(form.amount) || 0,
      date: form.date,
      createdAt: new Date().toISOString(),
    };
    saveEntries([...entries, entry]);
    setForm({
      projectId: "",
      type: "material",
      description: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const handleSendToAccounting = (project: Project) => {
    const stats = getProjectStats(project.id);
    if (stats.totalCost <= 0) return;
    const accounting: object[] = (() => {
      try {
        return JSON.parse(localStorage.getItem(ACCOUNTING_KEY) || "[]");
      } catch {
        return [];
      }
    })();
    const newEntry = {
      id: `pc_${Date.now()}`,
      type: "expense",
      category: "Proje Maliyeti",
      description: project.name,
      amount: stats.totalCost,
      date: new Date().toISOString().split("T")[0],
      currency: "TRY",
      vatRate: 0,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(
      ACCOUNTING_KEY,
      JSON.stringify([...accounting, newEntry]),
    );
    setSentProjects((prev) => new Set([...prev, project.id]));
  };

  const typeColor = (type: string) => {
    if (type === "labor")
      return "bg-violet-500/20 text-violet-300 border-violet-500/30";
    if (type === "material")
      return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
    return "bg-slate-500/20 text-slate-300 border-slate-500/30";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/30">
          <TrendingUp className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">
            {t("projectcost.title")}
          </h2>
          <p className="text-sm text-slate-400">{t("projectcost.subtitle")}</p>
        </div>
      </div>

      <Tabs defaultValue="costs">
        <TabsList className="bg-slate-800/60 border border-slate-700/50">
          <TabsTrigger
            value="costs"
            className="data-[state=active]:bg-violet-600 data-[state=active]:text-white"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {t("projectcost.costs")}
          </TabsTrigger>
          <TabsTrigger
            value="add"
            className="data-[state=active]:bg-violet-600 data-[state=active]:text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("projectcost.addEntry")}
          </TabsTrigger>
        </TabsList>

        {/* Project Costs Tab */}
        <TabsContent value="costs" className="mt-4 space-y-4">
          {projects.length === 0 ? (
            <div
              className="text-center py-12 text-slate-400"
              data-ocid="projectcost.empty_state"
            >
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t("projectcost.noProjects")}</p>
            </div>
          ) : (
            projects.map((project, idx) => {
              const stats = getProjectStats(project.id);
              const budgetPct =
                stats.budget > 0
                  ? Math.min(100, (stats.totalCost / stats.budget) * 100)
                  : 0;
              const isEditing = !!editBudget[project.id];
              const isSent = sentProjects.has(project.id);

              return (
                <div
                  key={project.id}
                  className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-4"
                  data-ocid={`projectcost.item.${idx + 1}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">
                        {project.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-xs mt-1 border-slate-600 text-slate-400"
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant={isSent ? "outline" : "default"}
                      className={
                        isSent
                          ? "border-green-500/50 text-green-400"
                          : "bg-violet-600 hover:bg-violet-700 text-white"
                      }
                      onClick={() => handleSendToAccounting(project)}
                      disabled={isSent}
                      data-ocid={`projectcost.send_button.${idx + 1}`}
                    >
                      {isSent ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {t("projectcost.sent")}
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4 mr-1" />
                          {t("projectcost.sendToAccounting")}
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Budget editor */}
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2 items-end">
                      <div>
                        <Label className="text-xs text-slate-400">
                          {t("projectcost.budget")}
                        </Label>
                        <Input
                          type="number"
                          className="w-32 bg-slate-900 border-slate-700 text-white h-8"
                          value={editBudget[project.id]?.budget || ""}
                          onChange={(e) =>
                            setEditBudget((prev) => ({
                              ...prev,
                              [project.id]: {
                                ...prev[project.id],
                                budget: e.target.value,
                              },
                            }))
                          }
                          data-ocid={`projectcost.budget.input.${idx + 1}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">
                          {t("projectcost.hourlyRate")}
                        </Label>
                        <Input
                          type="number"
                          className="w-32 bg-slate-900 border-slate-700 text-white h-8"
                          value={editBudget[project.id]?.hourlyRate || ""}
                          onChange={(e) =>
                            setEditBudget((prev) => ({
                              ...prev,
                              [project.id]: {
                                ...prev[project.id],
                                hourlyRate: e.target.value,
                              },
                            }))
                          }
                          data-ocid={`projectcost.hourlyrate.input.${idx + 1}`}
                        />
                      </div>
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white h-8"
                        onClick={() => handleSetBudget(project.id)}
                        data-ocid={`projectcost.save_button.${idx + 1}`}
                      >
                        {t("projectcost.setBudget")}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-indigo-400 hover:text-indigo-300 h-7 px-2"
                      onClick={() =>
                        setEditBudget((prev) => ({
                          ...prev,
                          [project.id]: {
                            budget: String(stats.budget),
                            hourlyRate: String(stats.hourlyRate),
                          },
                        }))
                      }
                      data-ocid={`projectcost.edit_button.${idx + 1}`}
                    >
                      {t("projectcost.setBudget")}:{" "}
                      {stats.budget.toLocaleString()} ₺
                    </Button>
                  )}

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500">
                        {t("projectcost.laborCost")}
                      </p>
                      <p className="text-sm font-semibold text-violet-300">
                        {stats.laborCost.toLocaleString()} ₺
                      </p>
                      <p className="text-xs text-slate-500">
                        {stats.totalHours} {t("projectcost.hours")}
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500">
                        {t("projectcost.manualCost")}
                      </p>
                      <p className="text-sm font-semibold text-indigo-300">
                        {stats.manualCost.toLocaleString()} ₺
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500">
                        {t("projectcost.totalCost")}
                      </p>
                      <p className="text-sm font-semibold text-white">
                        {stats.totalCost.toLocaleString()} ₺
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500">
                        {t("projectcost.profit")}
                      </p>
                      <p
                        className={`text-sm font-semibold ${stats.profit >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {stats.profit >= 0 ? "+" : ""}
                        {stats.profit.toLocaleString()} ₺
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {stats.budget > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>
                          {t("projectcost.budget")}:{" "}
                          {stats.budget.toLocaleString()} ₺
                        </span>
                        <span>{budgetPct.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${budgetPct >= 100 ? "bg-red-500" : budgetPct >= 75 ? "bg-amber-500" : "bg-violet-500"}`}
                          style={{ width: `${budgetPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </TabsContent>

        {/* Add Entry Tab */}
        <TabsContent value="add" className="mt-4">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-4">
            <div className="space-y-1">
              <Label className="text-slate-300">
                {t("projectcost.project")}
              </Label>
              <Select
                value={form.projectId}
                onValueChange={(v) => setForm((f) => ({ ...f, projectId: v }))}
              >
                <SelectTrigger
                  className="bg-slate-900 border-slate-700 text-white"
                  data-ocid="projectcost.select"
                >
                  <SelectValue placeholder={t("projectcost.project")} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {projects.map((p) => (
                    <SelectItem
                      key={p.id}
                      value={p.id}
                      className="text-white hover:bg-slate-800"
                    >
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-slate-300">{t("projectcost.type")}</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, type: v as CostEntry["type"] }))
                }
              >
                <SelectTrigger
                  className="bg-slate-900 border-slate-700 text-white"
                  data-ocid="projectcost.type.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem
                    value="labor"
                    className="text-white hover:bg-slate-800"
                  >
                    {t("projectcost.labor")}
                  </SelectItem>
                  <SelectItem
                    value="material"
                    className="text-white hover:bg-slate-800"
                  >
                    {t("projectcost.material")}
                  </SelectItem>
                  <SelectItem
                    value="overhead"
                    className="text-white hover:bg-slate-800"
                  >
                    {t("projectcost.overhead")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-slate-300">
                {t("projectcost.description")}
              </Label>
              <Input
                className="bg-slate-900 border-slate-700 text-white"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                data-ocid="projectcost.input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-slate-300">
                  {t("projectcost.amount")}
                </Label>
                <Input
                  type="number"
                  className="bg-slate-900 border-slate-700 text-white"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  data-ocid="projectcost.amount.input"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300">
                  {t("projectcost.date")}
                </Label>
                <Input
                  type="date"
                  className="bg-slate-900 border-slate-700 text-white"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  data-ocid="projectcost.date.input"
                />
              </div>
            </div>

            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              onClick={handleAddEntry}
              data-ocid="projectcost.submit_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("projectcost.addEntry")}
            </Button>

            {/* Recent entries */}
            {entries.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Son Giderler
                </p>
                {entries
                  .slice(-5)
                  .reverse()
                  .map((entry, i) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2"
                      data-ocid={`projectcost.row.${i + 1}`}
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${typeColor(entry.type)}`}
                        >
                          {t(`projectcost.${entry.type}`)}
                        </Badge>
                        <span className="text-sm text-slate-300">
                          {entry.description}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {entry.amount.toLocaleString()} ₺
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
