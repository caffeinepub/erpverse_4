import { Plus, Search, Users2 } from "lucide-react";
import { useState } from "react";
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

type EmployeeStatus = "active" | "onLeave" | "terminated";

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  status: EmployeeStatus;
  email: string;
}

const STATUS_COLORS: Record<EmployeeStatus, string> = {
  active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  onLeave: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  terminated: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function HRModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const [employees, setEmployees] = useLocalStorage<Employee[]>(
    `erpverse_hr_${company?.id || "default"}`,
    [],
  );
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    position: "",
    department: "",
    status: "active" as EmployeeStatus,
    email: "",
  });

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()),
  );

  const stats = [
    {
      label: t("hr.totalEmployees"),
      value: employees.length,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      label: t("hr.active"),
      value: employees.filter((e) => e.status === "active").length,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: t("hr.onLeave"),
      value: employees.filter((e) => e.status === "onLeave").length,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
  ];

  const openAdd = () => {
    setEditId(null);
    setForm({
      name: "",
      position: "",
      department: "",
      status: "active",
      email: "",
    });
    setShowDialog(true);
  };

  const openEdit = (emp: Employee) => {
    setEditId(emp.id);
    setForm({
      name: emp.name,
      position: emp.position,
      department: emp.department,
      status: emp.status,
      email: emp.email,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editId) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === editId ? { ...e, ...form } : e)),
      );
    } else {
      setEmployees((prev) => [...prev, { id: Date.now().toString(), ...form }]);
    }
    setShowDialog(false);
  };

  const handleDelete = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users2 className="w-6 h-6 text-purple-400" />
            {t("hr.title")}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {employees.length} {t("hr.employee").toLowerCase()}
          </p>
        </div>
        <Button
          className="bg-purple-600 hover:bg-purple-700 text-white"
          onClick={openAdd}
          data-ocid="hr.add_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("hr.addEmployee")}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className={`${s.bg} border rounded-xl p-4`}>
            <p className="text-slate-400 text-xs mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("hr.searchEmployee")}
          className="pl-9 bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
          data-ocid="hr.search_input"
        />
      </div>

      <div
        className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
        data-ocid="hr.table"
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                {t("hr.employee")}
              </th>
              <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                {t("hr.position")}
              </th>
              <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                {t("hr.department")}
              </th>
              <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                {t("hr.status")}
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
                    data-ocid="hr.empty_state"
                  >
                    <Users2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">{t("hr.searchEmployee")}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((emp, i) => (
                <tr
                  key={emp.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/2"
                  data-ocid={`hr.row.${i + 1}`}
                >
                  <td className="px-5 py-3">
                    <p className="text-white font-medium text-sm">{emp.name}</p>
                    <p className="text-xs text-slate-500">{emp.email}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-300 text-sm">
                    {emp.position}
                  </td>
                  <td className="px-5 py-3 text-slate-300 text-sm">
                    {emp.department}
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      variant="outline"
                      className={`text-xs ${STATUS_COLORS[emp.status]}`}
                    >
                      {t(`hr.${emp.status}`)}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(emp)}
                      className="text-xs text-slate-400 hover:text-purple-300 mr-3 transition-colors"
                      data-ocid={`hr.edit_button.${i + 1}`}
                    >
                      {t("hr.addEmployee").replace("Ekle", "Düzenle")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(emp.id)}
                      className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                      data-ocid={`hr.delete_button.${i + 1}`}
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
          data-ocid="hr.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {editId ? t("hr.employee") : t("hr.addEmployee")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("hr.employee")}
              </Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                data-ocid="hr.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("hr.position")}
              </Label>
              <Input
                value={form.position}
                onChange={(e) =>
                  setForm((p) => ({ ...p, position: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("hr.department")}
              </Label>
              <Input
                value={form.department}
                onChange={(e) =>
                  setForm((p) => ({ ...p, department: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("hr.status")}
              </Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, status: v as EmployeeStatus }))
                }
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="hr.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="active" className="text-white">
                    {t("hr.active")}
                  </SelectItem>
                  <SelectItem value="onLeave" className="text-white">
                    {t("hr.onLeave")}
                  </SelectItem>
                  <SelectItem value="terminated" className="text-white">
                    {t("hr.terminated")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowDialog(false)}
                data-ocid="hr.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleSave}
                data-ocid="hr.save_button"
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
