import { Plus, Search, Users2 } from "lucide-react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { useAuditLog } from "../contexts/AuditLogContext";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

type EmployeeStatus = "active" | "onLeave" | "terminated";

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  status: EmployeeStatus;
  email: string;
  salary?: number;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const STATUS_COLORS: Record<EmployeeStatus, string> = {
  active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  onLeave: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  terminated: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function HRModule() {
  const { t } = useLanguage();
  const { company, membership } = useAuth();
  const companyId = company?.id || "default";
  const { addNotification } = useNotifications();
  const { addLog } = useAuditLog();

  const isManagerOrOwner =
    membership?.roles.some(
      (r) => "CompanyOwner" in r || "CompanyManager" in r,
    ) ?? false;

  const [employees, setEmployees] = useLocalStorage<Employee[]>(
    `erpverse_hr_${companyId}`,
    [],
  );
  const [leaveRequests, setLeaveRequests] = useLocalStorage<LeaveRequest[]>(
    `erpverse_leave_requests_${companyId}`,
    [],
  );

  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    position: "",
    department: "",
    status: "active" as EmployeeStatus,
    email: "",
    salary: "",
  });
  const [leaveForm, setLeaveForm] = useState({
    employeeId: "",
    startDate: "",
    endDate: "",
    reason: "",
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
      salary: "",
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
      salary: emp.salary ? String(emp.salary) : "",
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const salary = Number(form.salary) || 0;
    if (editId) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === editId ? { ...e, ...form, salary } : e)),
      );
      addLog({
        action: `${t("hr.employee")} ${t("common.save")}`,
        module: "HR",
        detail: form.name,
      });
    } else {
      const newEmp: Employee = {
        id: Date.now().toString(),
        name: form.name,
        position: form.position,
        department: form.department,
        status: form.status,
        email: form.email,
        salary,
      };
      setEmployees((prev) => [...prev, newEmp]);
      addLog({
        action: t("hr.addEmployee"),
        module: "HR",
        detail: form.name,
      });
      if (salary > 0) {
        const key = `erpverse_accounting_${companyId}`;
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        const entry = {
          id: (Date.now() + 1).toString(),
          type: "expense",
          description: `${form.name} - ${t("integration.salaryExpenseDesc")}`,
          amount: salary,
          date: new Date().toISOString().slice(0, 10),
          category: t("integration.salaryCategory"),
        };
        localStorage.setItem(key, JSON.stringify([...existing, entry]));
        toast.success(t("integration.salaryAdded"));
      }
    }
    setShowDialog(false);
  };

  const handleDelete = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    if (emp) {
      addLog({
        action: t("personnel.remove"),
        module: "HR",
        detail: emp.name,
      });
    }
  };

  const handleAddLeave = () => {
    if (!leaveForm.employeeId || !leaveForm.startDate || !leaveForm.endDate)
      return;
    const emp = employees.find((e) => e.id === leaveForm.employeeId);
    if (!emp) return;
    const req: LeaveRequest = {
      id: Date.now().toString(),
      employeeId: leaveForm.employeeId,
      employeeName: emp.name,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      reason: leaveForm.reason,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setLeaveRequests((prev) => [...prev, req]);
    addNotification({
      type: "leave_request",
      title: t("approval.leaveRequestTitle"),
      message: `${emp.name} - ${t("approval.leaveRequestMsg")}`,
      companyId,
      targetRole: "manager",
    });
    addLog({
      action: t("hr.addLeaveRequest"),
      module: "HR",
      detail: `${emp.name} ${leaveForm.startDate} - ${leaveForm.endDate}`,
    });
    setLeaveForm({ employeeId: "", startDate: "", endDate: "", reason: "" });
    setShowLeaveDialog(false);
  };

  const handleLeaveApprove = (id: string) => {
    const req = leaveRequests.find((r) => r.id === id);
    if (!req) return;
    setLeaveRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)),
    );
    addNotification({
      type: "info",
      title: t("approval.approved"),
      message: `${req.employeeName} - ${t("hr.leaveRequests")}`,
      companyId,
      targetRole: "all",
    });
    addLog({
      action: `${t("approval.approved")} - ${t("hr.leaveRequests")}`,
      module: "HR",
      detail: `${req.employeeName} ${req.startDate} - ${req.endDate}`,
    });
  };

  const handleLeaveReject = (id: string) => {
    const req = leaveRequests.find((r) => r.id === id);
    if (!req) return;
    setLeaveRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)),
    );
    addNotification({
      type: "info",
      title: t("approval.rejected"),
      message: `${req.employeeName} - ${t("hr.leaveRequests")}`,
      companyId,
      targetRole: "all",
    });
    addLog({
      action: `${t("approval.rejected")} - ${t("hr.leaveRequests")}`,
      module: "HR",
      detail: `${req.employeeName} ${req.startDate} - ${req.endDate}`,
    });
  };

  const leaveStatusBadge = (status: LeaveRequest["status"]) => {
    const map = {
      pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      approved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      rejected: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    const labels = {
      pending: t("hr.leavePending"),
      approved: t("hr.leaveApproved"),
      rejected: t("hr.leaveRejected"),
    };
    return (
      <Badge variant="outline" className={`text-xs ${map[status]}`}>
        {labels[status]}
      </Badge>
    );
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
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className={`${s.bg} border rounded-xl p-4`}>
            <p className="text-slate-400 text-xs mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="bg-slate-800 border border-white/5 mb-6">
          <TabsTrigger
            value="employees"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400"
            data-ocid="hr.employees.tab"
          >
            {t("hr.title")}
          </TabsTrigger>
          <TabsTrigger
            value="leave"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400"
            data-ocid="hr.leave.tab"
          >
            {t("hr.leaveRequests")}
            {leaveRequests.filter((r) => r.status === "pending").length > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {leaveRequests.filter((r) => r.status === "pending").length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("hr.searchEmployee")}
                className="pl-9 bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
                data-ocid="hr.search_input"
              />
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
                        <p className="text-white font-medium text-sm">
                          {emp.name}
                        </p>
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
                          ✎
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
        </TabsContent>

        <TabsContent value="leave">
          <div className="flex justify-end mb-4">
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setShowLeaveDialog(true)}
              data-ocid="hr.leave.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("hr.addLeaveRequest")}
            </Button>
          </div>

          {leaveRequests.length === 0 ? (
            <div
              className="text-center py-16 text-slate-500"
              data-ocid="hr.leave.empty_state"
            >
              <Users2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>{t("hr.leaveEmpty")}</p>
            </div>
          ) : (
            <div
              className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
              data-ocid="hr.leave.table"
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                      {t("hr.leaveEmployee")}
                    </th>
                    <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                      {t("hr.leaveStart")}
                    </th>
                    <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                      {t("hr.leaveEnd")}
                    </th>
                    <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                      {t("hr.leaveReason")}
                    </th>
                    <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                      {t("hr.leaveStatus")}
                    </th>
                    {isManagerOrOwner && <th className="px-5 py-3" />}
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map((req, i) => (
                    <tr
                      key={req.id}
                      className="border-b border-white/5 last:border-0"
                      data-ocid={`hr.leave.row.${i + 1}`}
                    >
                      <td className="px-5 py-3 text-white text-sm font-medium">
                        {req.employeeName}
                      </td>
                      <td className="px-5 py-3 text-slate-300 text-sm">
                        {req.startDate}
                      </td>
                      <td className="px-5 py-3 text-slate-300 text-sm">
                        {req.endDate}
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs">
                        {req.reason}
                      </td>
                      <td className="px-5 py-3">
                        {leaveStatusBadge(req.status)}
                      </td>
                      {isManagerOrOwner && (
                        <td className="px-5 py-3 text-right">
                          {req.status === "pending" && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleLeaveApprove(req.id)}
                                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                                data-ocid={`hr.leave.confirm_button.${i + 1}`}
                              >
                                {t("approval.approve")}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleLeaveReject(req.id)}
                                className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                data-ocid={`hr.leave.delete_button.${i + 1}`}
                              >
                                {t("approval.reject")}
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Employee Dialog */}
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
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("hr.salary")}
              </Label>
              <Input
                type="number"
                value={form.salary}
                onChange={(e) =>
                  setForm((p) => ({ ...p, salary: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                placeholder="0"
                data-ocid="hr.salary_input"
              />
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

      {/* Leave Request Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-md"
          data-ocid="hr.leave.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("hr.addLeaveRequest")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("hr.leaveEmployee")}
              </Label>
              <Select
                value={leaveForm.employeeId}
                onValueChange={(v) =>
                  setLeaveForm((p) => ({ ...p, employeeId: v }))
                }
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="hr.leave.select"
                >
                  <SelectValue placeholder={t("hr.leaveEmployee")} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id} className="text-white">
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("hr.leaveStart")}
                </Label>
                <Input
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) =>
                    setLeaveForm((p) => ({ ...p, startDate: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="hr.leave.input"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("hr.leaveEnd")}
                </Label>
                <Input
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) =>
                    setLeaveForm((p) => ({ ...p, endDate: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("hr.leaveReason")}
              </Label>
              <Textarea
                value={leaveForm.reason}
                onChange={(e) =>
                  setLeaveForm((p) => ({ ...p, reason: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white resize-none"
                rows={3}
                data-ocid="hr.leave.textarea"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowLeaveDialog(false)}
                data-ocid="hr.leave.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleAddLeave}
                data-ocid="hr.leave.submit_button"
              >
                {t("hr.addLeaveRequest")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
