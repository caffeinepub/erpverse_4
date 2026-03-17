import { BarChart2, Clock, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

interface TimesheetEntry {
  id: string;
  projectId: string;
  projectName: string;
  date: string;
  hours: number;
  description: string;
  userId: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
}

export default function TimesheetModule() {
  const { t } = useLanguage();
  const { company, user } = useAuth();
  const companyId = company?.id ?? "default";
  const userId = user?.id ?? "";
  const STORAGE_KEY = `erpverse_timesheets_${companyId}`;
  const PROJECTS_KEY = `erpverse_projects_${companyId}`;

  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    projectId: "",
    date: new Date().toISOString().split("T")[0],
    hours: "1",
    description: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setEntries(JSON.parse(stored));
      } catch {}
    }
    const storedProjects = localStorage.getItem(PROJECTS_KEY);
    if (storedProjects) {
      try {
        const parsed = JSON.parse(storedProjects);
        setProjects(
          parsed.map((p: { id: string; name: string }) => ({
            id: p.id,
            name: p.name,
          })),
        );
      } catch {}
    }
  }, [STORAGE_KEY, PROJECTS_KEY]);

  const save = (updated: TimesheetEntry[]) => {
    setEntries(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleAdd = () => {
    const h = Number.parseFloat(form.hours);
    if (!form.projectId || !form.date || Number.isNaN(h) || h < 0.5 || h > 24)
      return;
    const project = projects.find((p) => p.id === form.projectId);
    const entry: TimesheetEntry = {
      id: `ts-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      projectId: form.projectId,
      projectName: project?.name ?? form.projectId,
      date: form.date,
      hours: h,
      description: form.description,
      userId,
      createdAt: new Date().toISOString(),
    };
    save([entry, ...entries]);
    setForm({
      projectId: "",
      date: new Date().toISOString().split("T")[0],
      hours: "1",
      description: "",
    });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    save(entries.filter((e) => e.id !== id));
  };

  // Summary calculations
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const hoursThisWeek = entries
    .filter((e) => new Date(e.date) >= startOfWeek)
    .reduce((sum, e) => sum + e.hours, 0);

  const hoursThisMonth = entries
    .filter((e) => new Date(e.date) >= startOfMonth)
    .reduce((sum, e) => sum + e.hours, 0);

  // Per-project hours
  const projectHours: Record<string, { name: string; hours: number }> = {};
  for (const e of entries) {
    if (!projectHours[e.projectId]) {
      projectHours[e.projectId] = { name: e.projectName, hours: 0 };
    }
    projectHours[e.projectId].hours += e.hours;
  }
  const projectSummary = Object.values(projectHours).sort(
    (a, b) => b.hours - a.hours,
  );
  const maxHours = projectSummary[0]?.hours ?? 1;

  const COLORS = [
    "bg-emerald-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-pink-500",
    "bg-orange-500",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Clock className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              {t("timesheet.title")}
            </h2>
            <p className="text-sm text-slate-400">{t("timesheet.summary")}</p>
          </div>
        </div>
        <Button
          data-ocid="timesheet.primary_button"
          onClick={() => setShowForm((v) => !v)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          {t("timesheet.addEntry")}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-slate-400 text-sm">{t("timesheet.thisWeek")}</p>
          <p className="text-3xl font-bold text-emerald-400 mt-1">
            {hoursThisWeek.toFixed(1)}
          </p>
          <p className="text-slate-500 text-xs mt-1">{t("timesheet.hours")}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-slate-400 text-sm">{t("timesheet.thisMonth")}</p>
          <p className="text-3xl font-bold text-blue-400 mt-1">
            {hoursThisMonth.toFixed(1)}
          </p>
          <p className="text-slate-500 text-xs mt-1">{t("timesheet.hours")}</p>
        </div>
      </div>

      {/* Per-project summary */}
      {projectSummary.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-300">
              {t("timesheet.totalHours")} ({t("timesheet.project")})
            </h3>
          </div>
          {projectSummary.map((ps, i) => (
            <div key={ps.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 truncate max-w-[200px]">
                  {ps.name}
                </span>
                <span className="text-slate-400">
                  {ps.hours.toFixed(1)} {t("timesheet.hours")}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`${COLORS[i % COLORS.length]} h-2 rounded-full transition-all`}
                  style={{ width: `${(ps.hours / maxHours) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div
          data-ocid="timesheet.panel"
          className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4"
        >
          <h3 className="text-base font-semibold text-white">
            {t("timesheet.addEntry")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-slate-300 text-sm">
                {t("timesheet.project")}
              </Label>
              {projects.length > 0 ? (
                <Select
                  value={form.projectId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, projectId: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="timesheet.select"
                    className="bg-slate-900 border-slate-600 text-white"
                  >
                    <SelectValue placeholder={t("timesheet.project")} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {projects.map((p) => (
                      <SelectItem
                        key={p.id}
                        value={p.id}
                        className="text-white"
                      >
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  data-ocid="timesheet.input"
                  value={form.projectId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, projectId: e.target.value }))
                  }
                  placeholder={t("timesheet.project")}
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                />
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300 text-sm">
                {t("timesheet.date")}
              </Label>
              <Input
                data-ocid="timesheet.input"
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                className="bg-slate-900 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300 text-sm">
                {t("timesheet.hours")}
              </Label>
              <Input
                data-ocid="timesheet.input"
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={form.hours}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hours: e.target.value }))
                }
                className="bg-slate-900 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-slate-300 text-sm">
                {t("timesheet.description")}
              </Label>
              <Textarea
                data-ocid="timesheet.textarea"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder={t("timesheet.description")}
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              data-ocid="timesheet.cancel_button"
              variant="outline"
              onClick={() => setShowForm(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              {t("common.cancel")}
            </Button>
            <Button
              data-ocid="timesheet.submit_button"
              onClick={handleAdd}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {t("common.save")}
            </Button>
          </div>
        </div>
      )}

      {/* Entries Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {entries.length === 0 ? (
          <div
            data-ocid="timesheet.empty_state"
            className="flex flex-col items-center justify-center py-12 gap-3"
          >
            <Clock className="w-10 h-10 text-slate-600" />
            <p className="text-slate-400">{t("timesheet.empty")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table data-ocid="timesheet.table" className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-xs text-slate-400 font-medium px-4 py-3">
                    {t("timesheet.project")}
                  </th>
                  <th className="text-left text-xs text-slate-400 font-medium px-4 py-3">
                    {t("timesheet.date")}
                  </th>
                  <th className="text-left text-xs text-slate-400 font-medium px-4 py-3">
                    {t("timesheet.hours")}
                  </th>
                  <th className="text-left text-xs text-slate-400 font-medium px-4 py-3">
                    {t("timesheet.description")}
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    data-ocid={`timesheet.item.${idx + 1}`}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-white font-medium">
                      {entry.projectName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {entry.date}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-sm font-semibold px-2 py-0.5 rounded-full">
                        {entry.hours}h
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 max-w-[200px] truncate">
                      {entry.description || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        data-ocid={`timesheet.delete_button.${idx + 1}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                        className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 h-7 w-7 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
