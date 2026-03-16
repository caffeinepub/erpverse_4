import { Clock, Plus, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";
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
import { useLanguage } from "../contexts/LanguageContext";

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  type: "morning" | "afternoon" | "night" | "flexible";
}

interface ShiftAssignment {
  id: string;
  employeeName: string;
  shiftId: string;
  date: string;
  status: "planned" | "completed" | "absent";
  overtimeHours: number;
}

export default function ShiftModule() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    "assignments" | "shifts" | "overtime"
  >("assignments");
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);

  // Shift form
  const [newShiftName, setNewShiftName] = useState("");
  const [newShiftStart, setNewShiftStart] = useState("08:00");
  const [newShiftEnd, setNewShiftEnd] = useState("17:00");
  const [newShiftType, setNewShiftType] = useState<Shift["type"]>("morning");

  // Assignment form
  const [newEmpName, setNewEmpName] = useState("");
  const [newShiftId, setNewShiftId] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newOvertime, setNewOvertime] = useState("0");
  const [newStatus, setNewStatus] =
    useState<ShiftAssignment["status"]>("planned");

  const STORAGE_KEY_SHIFTS = "erpverse_shifts";
  const STORAGE_KEY_ASSIGNMENTS = "erpverse_shift_assignments";

  useEffect(() => {
    const s = localStorage.getItem(STORAGE_KEY_SHIFTS);
    if (s) setShifts(JSON.parse(s));
    const a = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
    if (a) setAssignments(JSON.parse(a));
  }, []);

  const saveShifts = (data: Shift[]) => {
    setShifts(data);
    localStorage.setItem(STORAGE_KEY_SHIFTS, JSON.stringify(data));
  };

  const saveAssignments = (data: ShiftAssignment[]) => {
    setAssignments(data);
    localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(data));
  };

  const addShift = () => {
    if (!newShiftName.trim()) return;
    const shift: Shift = {
      id: Date.now().toString(),
      name: newShiftName.trim(),
      startTime: newShiftStart,
      endTime: newShiftEnd,
      type: newShiftType,
    };
    saveShifts([...shifts, shift]);
    setNewShiftName("");
    setNewShiftStart("08:00");
    setNewShiftEnd("17:00");
  };

  const deleteShift = (id: string) =>
    saveShifts(shifts.filter((s) => s.id !== id));

  const addAssignment = () => {
    if (!newEmpName.trim() || !newShiftId || !newDate) return;
    const a: ShiftAssignment = {
      id: Date.now().toString(),
      employeeName: newEmpName.trim(),
      shiftId: newShiftId,
      date: newDate,
      status: newStatus,
      overtimeHours: Number.parseFloat(newOvertime) || 0,
    };
    saveAssignments([...assignments, a]);
    setNewEmpName("");
    setNewShiftId("");
    setNewDate("");
    setNewOvertime("0");
  };

  const deleteAssignment = (id: string) =>
    saveAssignments(assignments.filter((a) => a.id !== id));

  const updateStatus = (id: string, status: ShiftAssignment["status"]) => {
    saveAssignments(
      assignments.map((a) => (a.id === id ? { ...a, status } : a)),
    );
  };

  const getShiftName = (shiftId: string) =>
    shifts.find((s) => s.id === shiftId)?.name ?? "-";

  const typeColor: Record<Shift["type"], string> = {
    morning: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    afternoon: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    night: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    flexible: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  };

  const statusColor: Record<ShiftAssignment["status"], string> = {
    planned: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    absent: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  // Overtime summary
  const overtimeSummary = assignments.reduce(
    (acc, a) => {
      if (a.overtimeHours > 0) {
        acc[a.employeeName] = (acc[a.employeeName] || 0) + a.overtimeHours;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-6 h-6 text-cyan-400" />
        <h2 className="text-2xl font-bold text-white">{t("modules.Shifts")}</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6" data-ocid="shift.tab">
        {(["assignments", "shifts", "overtime"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-cyan-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
            data-ocid={`shift.${tab}_tab`}
          >
            {t(`shift.tab.${tab}`)}
          </button>
        ))}
      </div>

      {/* Vardiya Tanımları */}
      {activeTab === "shifts" && (
        <div>
          <div className="bg-slate-800 rounded-xl border border-white/5 p-5 mb-5">
            <h3 className="text-white font-semibold mb-4">
              {t("shift.addShift")}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">
                  {t("shift.name")}
                </Label>
                <Input
                  value={newShiftName}
                  onChange={(e) => setNewShiftName(e.target.value)}
                  placeholder={t("shift.namePlaceholder")}
                  className="bg-white/5 border-white/10 text-white"
                  data-ocid="shift.name_input"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">
                  {t("shift.startTime")}
                </Label>
                <Input
                  type="time"
                  value={newShiftStart}
                  onChange={(e) => setNewShiftStart(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  data-ocid="shift.start_input"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">
                  {t("shift.endTime")}
                </Label>
                <Input
                  type="time"
                  value={newShiftEnd}
                  onChange={(e) => setNewShiftEnd(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  data-ocid="shift.end_input"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">
                  {t("shift.type")}
                </Label>
                <Select
                  value={newShiftType}
                  onValueChange={(v) => setNewShiftType(v as Shift["type"])}
                >
                  <SelectTrigger
                    className="bg-white/5 border-white/10 text-white"
                    data-ocid="shift.type_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">
                      {t("shift.type.morning")}
                    </SelectItem>
                    <SelectItem value="afternoon">
                      {t("shift.type.afternoon")}
                    </SelectItem>
                    <SelectItem value="night">
                      {t("shift.type.night")}
                    </SelectItem>
                    <SelectItem value="flexible">
                      {t("shift.type.flexible")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="mt-3 bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={addShift}
              disabled={!newShiftName.trim()}
              data-ocid="shift.add_button"
            >
              <Plus className="w-4 h-4 mr-1" />
              {t("common.add")}
            </Button>
          </div>

          {shifts.length === 0 ? (
            <div
              className="text-center py-12 text-slate-500"
              data-ocid="shift.shifts_empty_state"
            >
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>{t("shift.noShifts")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {shifts.map((s, i) => (
                <div
                  key={s.id}
                  className="bg-slate-800 rounded-xl border border-white/5 p-4 flex items-start justify-between"
                  data-ocid={`shift.shifts_item.${i + 1}`}
                >
                  <div>
                    <p className="text-white font-semibold">{s.name}</p>
                    <p className="text-slate-400 text-sm mt-0.5">
                      {s.startTime} – {s.endTime}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-xs mt-2 border ${typeColor[s.type]}`}
                    >
                      {t(`shift.type.${s.type}`)}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteShift(s.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                    data-ocid={`shift.shifts_delete_button.${i + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vardiya Atamaları */}
      {activeTab === "assignments" && (
        <div>
          <div className="bg-slate-800 rounded-xl border border-white/5 p-5 mb-5">
            <h3 className="text-white font-semibold mb-4">
              {t("shift.addAssignment")}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">
                  {t("shift.employee")}
                </Label>
                <Input
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  placeholder={t("shift.employeePlaceholder")}
                  className="bg-white/5 border-white/10 text-white"
                  data-ocid="shift.employee_input"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">
                  {t("shift.shift")}
                </Label>
                <Select value={newShiftId} onValueChange={setNewShiftId}>
                  <SelectTrigger
                    className="bg-white/5 border-white/10 text-white"
                    data-ocid="shift.shift_select"
                  >
                    <SelectValue placeholder={t("shift.selectShift")} />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.startTime}–{s.endTime})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">
                  {t("shift.date")}
                </Label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  data-ocid="shift.date_input"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">
                  {t("shift.overtime")}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={newOvertime}
                  onChange={(e) => setNewOvertime(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  data-ocid="shift.overtime_input"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">
                  {t("shift.status")}
                </Label>
                <Select
                  value={newStatus}
                  onValueChange={(v) =>
                    setNewStatus(v as ShiftAssignment["status"])
                  }
                >
                  <SelectTrigger
                    className="bg-white/5 border-white/10 text-white"
                    data-ocid="shift.status_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">
                      {t("shift.status.planned")}
                    </SelectItem>
                    <SelectItem value="completed">
                      {t("shift.status.completed")}
                    </SelectItem>
                    <SelectItem value="absent">
                      {t("shift.status.absent")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="mt-3 bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={addAssignment}
              disabled={!newEmpName.trim() || !newShiftId || !newDate}
              data-ocid="shift.assignment_add_button"
            >
              <Plus className="w-4 h-4 mr-1" />
              {t("common.add")}
            </Button>
          </div>

          {assignments.length === 0 ? (
            <div
              className="text-center py-12 text-slate-500"
              data-ocid="shift.assignments_empty_state"
            >
              <User className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>{t("shift.noAssignments")}</p>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full" data-ocid="shift.assignments_table">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                      {t("shift.employee")}
                    </th>
                    <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                      {t("shift.shift")}
                    </th>
                    <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                      {t("shift.date")}
                    </th>
                    <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                      {t("shift.overtime")}
                    </th>
                    <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                      {t("shift.status")}
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a, i) => (
                    <tr
                      key={a.id}
                      className="border-b border-white/5 last:border-0"
                      data-ocid={`shift.assignments_row.${i + 1}`}
                    >
                      <td className="px-4 py-3 text-white text-sm">
                        {a.employeeName}
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-sm">
                        {getShiftName(a.shiftId)}
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-sm">
                        {a.date}
                      </td>
                      <td className="px-4 py-3">
                        {a.overtimeHours > 0 ? (
                          <span className="text-amber-300 text-sm font-medium">
                            +{a.overtimeHours}h
                          </span>
                        ) : (
                          <span className="text-slate-500 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={a.status}
                          onValueChange={(v) =>
                            updateStatus(a.id, v as ShiftAssignment["status"])
                          }
                        >
                          <SelectTrigger
                            className={`h-7 text-xs w-32 border ${statusColor[a.status]} bg-transparent`}
                            data-ocid={`shift.status_select.${i + 1}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planned">
                              {t("shift.status.planned")}
                            </SelectItem>
                            <SelectItem value="completed">
                              {t("shift.status.completed")}
                            </SelectItem>
                            <SelectItem value="absent">
                              {t("shift.status.absent")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => deleteAssignment(a.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                          data-ocid={`shift.assignments_delete_button.${i + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Mesai Özeti */}
      {activeTab === "overtime" && (
        <div>
          <h3 className="text-white font-semibold mb-4">
            {t("shift.overtimeSummary")}
          </h3>
          {Object.keys(overtimeSummary).length === 0 ? (
            <div
              className="text-center py-12 text-slate-500"
              data-ocid="shift.overtime_empty_state"
            >
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>{t("shift.noOvertime")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(overtimeSummary).map(([name, hours], i) => (
                <div
                  key={name}
                  className="bg-slate-800 rounded-xl border border-white/5 p-4 flex items-center gap-4"
                  data-ocid={`shift.overtime_item.${i + 1}`}
                >
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{name}</p>
                    <p className="text-amber-300 text-lg font-bold">{hours}h</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs border-amber-500/30 text-amber-300"
                  >
                    {t("shift.overtime")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
