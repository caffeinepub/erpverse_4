import { Edit2, Plus, Trash2, Wrench } from "lucide-react";
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

interface Equipment {
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  department: string;
  status: "active" | "passive";
  createdAt: string;
}

interface MaintenancePlan {
  id: string;
  equipmentId: string;
  scheduledDate: string;
  type: "preventive" | "corrective";
  responsible: string;
  status: "planned" | "in_progress" | "completed";
  notes: string;
  createdAt: string;
}

interface FaultReport {
  id: string;
  equipmentId: string;
  description: string;
  reporter: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
}

interface MaintenanceHistory {
  id: string;
  equipmentId: string;
  equipmentName: string;
  planId: string;
  type: string;
  responsible: string;
  completedAt: string;
  notes: string;
}

const genId = () => Math.random().toString(36).slice(2, 10);

export default function MaintenanceModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const { addLog } = useAuditLog();
  const cid = company?.id || "default";

  const [equipment, setEquipment] = useLocalStorage<Equipment[]>(
    `erp_maintenance_eq_${cid}`,
    [],
  );
  const [plans, setPlans] = useLocalStorage<MaintenancePlan[]>(
    `erp_maintenance_plans_${cid}`,
    [],
  );
  const [faults, setFaults] = useLocalStorage<FaultReport[]>(
    `erp_maintenance_faults_${cid}`,
    [],
  );
  const [history, setHistory] = useLocalStorage<MaintenanceHistory[]>(
    `erp_maintenance_history_${cid}`,
    [],
  );

  // Equipment state
  const [eqDialog, setEqDialog] = useState(false);
  const [editEq, setEditEq] = useState<Equipment | null>(null);
  const [eqForm, setEqForm] = useState({
    name: "",
    type: "",
    serialNumber: "",
    department: "",
    status: "active" as "active" | "passive",
  });

  // Plan state
  const [planDialog, setPlanDialog] = useState(false);
  const [editPlan, setEditPlan] = useState<MaintenancePlan | null>(null);
  const [planForm, setPlanForm] = useState({
    equipmentId: "",
    scheduledDate: "",
    type: "preventive" as "preventive" | "corrective",
    responsible: "",
    status: "planned" as "planned" | "in_progress" | "completed",
    notes: "",
  });

  // Fault state
  const [faultDialog, setFaultDialog] = useState(false);
  const [editFault, setEditFault] = useState<FaultReport | null>(null);
  const [faultForm, setFaultForm] = useState({
    equipmentId: "",
    description: "",
    reporter: "",
    severity: "medium" as "low" | "medium" | "high" | "critical",
    status: "open" as "open" | "in_progress" | "resolved",
  });

  const eqName = (id: string) => equipment.find((e) => e.id === id)?.name || id;

  // Equipment CRUD
  const openAddEq = () => {
    setEditEq(null);
    setEqForm({
      name: "",
      type: "",
      serialNumber: "",
      department: "",
      status: "active",
    });
    setEqDialog(true);
  };
  const openEditEq = (eq: Equipment) => {
    setEditEq(eq);
    setEqForm({
      name: eq.name,
      type: eq.type,
      serialNumber: eq.serialNumber,
      department: eq.department,
      status: eq.status,
    });
    setEqDialog(true);
  };
  const saveEq = () => {
    if (!eqForm.name.trim()) {
      toast.error(t("validation.required"));
      return;
    }
    if (editEq) {
      setEquipment((prev) =>
        prev.map((e) => (e.id === editEq.id ? { ...e, ...eqForm } : e)),
      );
      addLog({
        module: "Maintenance",
        action: t("common.update"),
        detail: eqForm.name,
      });
      toast.success(t("common.updated"));
    } else {
      const newEq: Equipment = {
        id: genId(),
        ...eqForm,
        createdAt: new Date().toISOString(),
      };
      setEquipment((prev) => [...prev, newEq]);
      addLog({
        module: "Maintenance",
        action: t("common.save"),
        detail: eqForm.name,
      });
      toast.success(t("common.saved"));
    }
    setEqDialog(false);
  };
  const deleteEq = (id: string) => {
    const eq = equipment.find((e) => e.id === id);
    setEquipment((prev) => prev.filter((e) => e.id !== id));
    addLog({
      module: "Maintenance",
      action: t("common.delete"),
      detail: eq?.name || "",
    });
    toast.success(t("common.deleted"));
  };

  // Plan CRUD
  const openAddPlan = () => {
    setEditPlan(null);
    setPlanForm({
      equipmentId: "",
      scheduledDate: "",
      type: "preventive",
      responsible: "",
      status: "planned",
      notes: "",
    });
    setPlanDialog(true);
  };
  const openEditPlan = (p: MaintenancePlan) => {
    setEditPlan(p);
    setPlanForm({
      equipmentId: p.equipmentId,
      scheduledDate: p.scheduledDate,
      type: p.type,
      responsible: p.responsible,
      status: p.status,
      notes: p.notes,
    });
    setPlanDialog(true);
  };
  const savePlan = () => {
    if (!planForm.equipmentId || !planForm.scheduledDate) {
      toast.error(t("validation.required"));
      return;
    }
    if (editPlan) {
      const wasCompleted =
        editPlan.status !== "completed" && planForm.status === "completed";
      setPlans((prev) =>
        prev.map((p) => (p.id === editPlan.id ? { ...p, ...planForm } : p)),
      );
      if (wasCompleted) {
        const histEntry: MaintenanceHistory = {
          id: genId(),
          equipmentId: planForm.equipmentId,
          equipmentName: eqName(planForm.equipmentId),
          planId: editPlan.id,
          type: planForm.type,
          responsible: planForm.responsible,
          completedAt: new Date().toISOString(),
          notes: planForm.notes,
        };
        setHistory((prev) => [...prev, histEntry]);
      }
      addLog({
        module: "Maintenance",
        action: t("common.update"),
        detail: eqName(planForm.equipmentId),
      });
      toast.success(t("common.updated"));
    } else {
      const newPlan: MaintenancePlan = {
        id: genId(),
        ...planForm,
        createdAt: new Date().toISOString(),
      };
      setPlans((prev) => [...prev, newPlan]);
      if (planForm.status === "completed") {
        const histEntry: MaintenanceHistory = {
          id: genId(),
          equipmentId: planForm.equipmentId,
          equipmentName: eqName(planForm.equipmentId),
          planId: newPlan.id,
          type: planForm.type,
          responsible: planForm.responsible,
          completedAt: new Date().toISOString(),
          notes: planForm.notes,
        };
        setHistory((prev) => [...prev, histEntry]);
      }
      addLog({
        module: "Maintenance",
        action: t("common.save"),
        detail: eqName(planForm.equipmentId),
      });
      toast.success(t("common.saved"));
    }
    setPlanDialog(false);
  };
  const deletePlan = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    addLog({
      module: "Maintenance",
      action: t("common.delete"),
      detail: t("maintenance.plans"),
    });
    toast.success(t("common.deleted"));
  };

  // Fault CRUD
  const openAddFault = () => {
    setEditFault(null);
    setFaultForm({
      equipmentId: "",
      description: "",
      reporter: "",
      severity: "medium",
      status: "open",
    });
    setFaultDialog(true);
  };
  const openEditFault = (f: FaultReport) => {
    setEditFault(f);
    setFaultForm({
      equipmentId: f.equipmentId,
      description: f.description,
      reporter: f.reporter,
      severity: f.severity,
      status: f.status,
    });
    setFaultDialog(true);
  };
  const saveFault = () => {
    if (!faultForm.description.trim()) {
      toast.error(t("validation.required"));
      return;
    }
    if (editFault) {
      setFaults((prev) =>
        prev.map((f) => (f.id === editFault.id ? { ...f, ...faultForm } : f)),
      );
      addLog({
        module: "Maintenance",
        action: t("common.update"),
        detail: faultForm.description,
      });
      toast.success(t("common.updated"));
    } else {
      setFaults((prev) => [
        ...prev,
        { id: genId(), ...faultForm, createdAt: new Date().toISOString() },
      ]);
      addLog({
        module: "Maintenance",
        action: t("common.save"),
        detail: faultForm.description,
      });
      toast.success(t("common.saved"));
    }
    setFaultDialog(false);
  };
  const deleteFault = (id: string) => {
    setFaults((prev) => prev.filter((f) => f.id !== id));
    addLog({
      module: "Maintenance",
      action: t("common.delete"),
      detail: t("maintenance.faults"),
    });
    toast.success(t("common.deleted"));
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      active: "bg-green-500/20 text-green-400",
      passive: "bg-slate-500/20 text-slate-400",
      planned: "bg-blue-500/20 text-blue-400",
      in_progress: "bg-yellow-500/20 text-yellow-400",
      completed: "bg-green-500/20 text-green-400",
      open: "bg-red-500/20 text-red-400",
      resolved: "bg-green-500/20 text-green-400",
    };
    return map[s] || "bg-slate-500/20 text-slate-400";
  };
  const severityColor = (s: string) => {
    const map: Record<string, string> = {
      low: "bg-green-500/20 text-green-400",
      medium: "bg-yellow-500/20 text-yellow-400",
      high: "bg-orange-500/20 text-orange-400",
      critical: "bg-red-500/20 text-red-400",
    };
    return map[s] || "bg-slate-500/20 text-slate-400";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Wrench className="w-6 h-6 text-orange-400" />
        <h2 className="text-xl font-bold text-foreground">
          {t("modules.Maintenance")}
        </h2>
      </div>

      <Tabs defaultValue="equipment">
        <TabsList className="mb-4">
          <TabsTrigger value="equipment" data-ocid="maintenance.equipment.tab">
            {t("maintenance.equipment")}
          </TabsTrigger>
          <TabsTrigger value="plans" data-ocid="maintenance.plans.tab">
            {t("maintenance.plans")}
          </TabsTrigger>
          <TabsTrigger value="faults" data-ocid="maintenance.faults.tab">
            {t("maintenance.faults")}
          </TabsTrigger>
          <TabsTrigger value="history" data-ocid="maintenance.history.tab">
            {t("maintenance.history")}
          </TabsTrigger>
        </TabsList>

        {/* Equipment Tab */}
        <TabsContent value="equipment">
          <div className="flex justify-end mb-3">
            <Button
              onClick={openAddEq}
              data-ocid="maintenance.equipment.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-1" />
              {t("maintenance.addEquipment")}
            </Button>
          </div>
          {equipment.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="maintenance.equipment.empty_state"
            >
              {t("common.noData")}
            </div>
          ) : (
            <Table data-ocid="maintenance.equipment.table">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("maintenance.equipmentName")}</TableHead>
                  <TableHead>{t("maintenance.type")}</TableHead>
                  <TableHead>{t("maintenance.serialNumber")}</TableHead>
                  <TableHead>{t("maintenance.department")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map((eq, idx) => (
                  <TableRow
                    key={eq.id}
                    data-ocid={`maintenance.equipment.row.${idx + 1}`}
                  >
                    <TableCell className="font-medium">{eq.name}</TableCell>
                    <TableCell>{eq.type}</TableCell>
                    <TableCell>{eq.serialNumber}</TableCell>
                    <TableCell>{eq.department}</TableCell>
                    <TableCell>
                      <Badge className={statusColor(eq.status)}>
                        {eq.status === "active"
                          ? t("common.active")
                          : t("common.passive")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditEq(eq)}
                          data-ocid={`maintenance.equipment.edit_button.${idx + 1}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteEq(eq.id)}
                          data-ocid={`maintenance.equipment.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans">
          <div className="flex justify-end mb-3">
            <Button
              onClick={openAddPlan}
              data-ocid="maintenance.plans.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-1" />
              {t("maintenance.addPlan")}
            </Button>
          </div>
          {plans.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="maintenance.plans.empty_state"
            >
              {t("common.noData")}
            </div>
          ) : (
            <Table data-ocid="maintenance.plans.table">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("maintenance.equipment")}</TableHead>
                  <TableHead>{t("maintenance.scheduledDate")}</TableHead>
                  <TableHead>{t("maintenance.maintenanceType")}</TableHead>
                  <TableHead>{t("maintenance.responsible")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((p, idx) => (
                  <TableRow
                    key={p.id}
                    data-ocid={`maintenance.plans.row.${idx + 1}`}
                  >
                    <TableCell>{eqName(p.equipmentId)}</TableCell>
                    <TableCell>{p.scheduledDate}</TableCell>
                    <TableCell>
                      {p.type === "preventive"
                        ? t("maintenance.preventive")
                        : t("maintenance.corrective")}
                    </TableCell>
                    <TableCell>{p.responsible}</TableCell>
                    <TableCell>
                      <Badge className={statusColor(p.status)}>
                        {t(`maintenance.status.${p.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditPlan(p)}
                          data-ocid={`maintenance.plans.edit_button.${idx + 1}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deletePlan(p.id)}
                          data-ocid={`maintenance.plans.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* Faults Tab */}
        <TabsContent value="faults">
          <div className="flex justify-end mb-3">
            <Button
              onClick={openAddFault}
              data-ocid="maintenance.faults.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-1" />
              {t("maintenance.addFault")}
            </Button>
          </div>
          {faults.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="maintenance.faults.empty_state"
            >
              {t("common.noData")}
            </div>
          ) : (
            <Table data-ocid="maintenance.faults.table">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("maintenance.equipment")}</TableHead>
                  <TableHead>{t("maintenance.faultDescription")}</TableHead>
                  <TableHead>{t("maintenance.reporter")}</TableHead>
                  <TableHead>{t("maintenance.severity")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {faults.map((f, idx) => (
                  <TableRow
                    key={f.id}
                    data-ocid={`maintenance.faults.row.${idx + 1}`}
                  >
                    <TableCell>{eqName(f.equipmentId)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {f.description}
                    </TableCell>
                    <TableCell>{f.reporter}</TableCell>
                    <TableCell>
                      <Badge className={severityColor(f.severity)}>
                        {t(`maintenance.severity.${f.severity}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColor(f.status)}>
                        {t(`maintenance.faultStatus.${f.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditFault(f)}
                          data-ocid={`maintenance.faults.edit_button.${idx + 1}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteFault(f.id)}
                          data-ocid={`maintenance.faults.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          {history.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="maintenance.history.empty_state"
            >
              {t("maintenance.noHistory")}
            </div>
          ) : (
            <Table data-ocid="maintenance.history.table">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("maintenance.equipment")}</TableHead>
                  <TableHead>{t("maintenance.maintenanceType")}</TableHead>
                  <TableHead>{t("maintenance.responsible")}</TableHead>
                  <TableHead>{t("maintenance.completedAt")}</TableHead>
                  <TableHead>{t("maintenance.notes")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h, idx) => (
                  <TableRow
                    key={h.id}
                    data-ocid={`maintenance.history.row.${idx + 1}`}
                  >
                    <TableCell>{h.equipmentName}</TableCell>
                    <TableCell>
                      {h.type === "preventive"
                        ? t("maintenance.preventive")
                        : t("maintenance.corrective")}
                    </TableCell>
                    <TableCell>{h.responsible}</TableCell>
                    <TableCell>
                      {new Date(h.completedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {h.notes}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* Equipment Dialog */}
      <Dialog open={eqDialog} onOpenChange={setEqDialog}>
        <DialogContent data-ocid="maintenance.equipment.dialog">
          <DialogHeader>
            <DialogTitle>
              {editEq
                ? t("maintenance.editEquipment")
                : t("maintenance.addEquipment")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t("maintenance.equipmentName")}</Label>
              <Input
                value={eqForm.name}
                onChange={(e) => setEqForm({ ...eqForm, name: e.target.value })}
                data-ocid="maintenance.equipment.input"
              />
            </div>
            <div>
              <Label>{t("maintenance.type")}</Label>
              <Input
                value={eqForm.type}
                onChange={(e) => setEqForm({ ...eqForm, type: e.target.value })}
              />
            </div>
            <div>
              <Label>{t("maintenance.serialNumber")}</Label>
              <Input
                value={eqForm.serialNumber}
                onChange={(e) =>
                  setEqForm({ ...eqForm, serialNumber: e.target.value })
                }
              />
            </div>
            <div>
              <Label>{t("maintenance.department")}</Label>
              <Input
                value={eqForm.department}
                onChange={(e) =>
                  setEqForm({ ...eqForm, department: e.target.value })
                }
              />
            </div>
            <div>
              <Label>{t("common.status")}</Label>
              <Select
                value={eqForm.status}
                onValueChange={(v) =>
                  setEqForm({ ...eqForm, status: v as "active" | "passive" })
                }
              >
                <SelectTrigger data-ocid="maintenance.equipment.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("common.active")}</SelectItem>
                  <SelectItem value="passive">{t("common.passive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setEqDialog(false)}
                data-ocid="maintenance.equipment.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={saveEq}
                data-ocid="maintenance.equipment.save_button"
              >
                {t("common.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plan Dialog */}
      <Dialog open={planDialog} onOpenChange={setPlanDialog}>
        <DialogContent data-ocid="maintenance.plans.dialog">
          <DialogHeader>
            <DialogTitle>
              {editPlan ? t("maintenance.editPlan") : t("maintenance.addPlan")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t("maintenance.equipment")}</Label>
              <Select
                value={planForm.equipmentId}
                onValueChange={(v) =>
                  setPlanForm({ ...planForm, equipmentId: v })
                }
              >
                <SelectTrigger data-ocid="maintenance.plans.select">
                  <SelectValue placeholder={t("maintenance.selectEquipment")} />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("maintenance.scheduledDate")}</Label>
              <Input
                type="date"
                value={planForm.scheduledDate}
                onChange={(e) =>
                  setPlanForm({ ...planForm, scheduledDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label>{t("maintenance.maintenanceType")}</Label>
              <Select
                value={planForm.type}
                onValueChange={(v) =>
                  setPlanForm({
                    ...planForm,
                    type: v as "preventive" | "corrective",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">
                    {t("maintenance.preventive")}
                  </SelectItem>
                  <SelectItem value="corrective">
                    {t("maintenance.corrective")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("maintenance.responsible")}</Label>
              <Input
                value={planForm.responsible}
                onChange={(e) =>
                  setPlanForm({ ...planForm, responsible: e.target.value })
                }
                data-ocid="maintenance.plans.input"
              />
            </div>
            <div>
              <Label>{t("common.status")}</Label>
              <Select
                value={planForm.status}
                onValueChange={(v) =>
                  setPlanForm({
                    ...planForm,
                    status: v as "planned" | "in_progress" | "completed",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">
                    {t("maintenance.status.planned")}
                  </SelectItem>
                  <SelectItem value="in_progress">
                    {t("maintenance.status.in_progress")}
                  </SelectItem>
                  <SelectItem value="completed">
                    {t("maintenance.status.completed")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("maintenance.notes")}</Label>
              <Textarea
                value={planForm.notes}
                onChange={(e) =>
                  setPlanForm({ ...planForm, notes: e.target.value })
                }
                data-ocid="maintenance.plans.textarea"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setPlanDialog(false)}
                data-ocid="maintenance.plans.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={savePlan}
                data-ocid="maintenance.plans.save_button"
              >
                {t("common.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fault Dialog */}
      <Dialog open={faultDialog} onOpenChange={setFaultDialog}>
        <DialogContent data-ocid="maintenance.faults.dialog">
          <DialogHeader>
            <DialogTitle>
              {editFault
                ? t("maintenance.editFault")
                : t("maintenance.addFault")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t("maintenance.equipment")}</Label>
              <Select
                value={faultForm.equipmentId}
                onValueChange={(v) =>
                  setFaultForm({ ...faultForm, equipmentId: v })
                }
              >
                <SelectTrigger data-ocid="maintenance.faults.select">
                  <SelectValue placeholder={t("maintenance.selectEquipment")} />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("maintenance.faultDescription")}</Label>
              <Textarea
                value={faultForm.description}
                onChange={(e) =>
                  setFaultForm({ ...faultForm, description: e.target.value })
                }
                data-ocid="maintenance.faults.textarea"
              />
            </div>
            <div>
              <Label>{t("maintenance.reporter")}</Label>
              <Input
                value={faultForm.reporter}
                onChange={(e) =>
                  setFaultForm({ ...faultForm, reporter: e.target.value })
                }
                data-ocid="maintenance.faults.input"
              />
            </div>
            <div>
              <Label>{t("maintenance.severity")}</Label>
              <Select
                value={faultForm.severity}
                onValueChange={(v) =>
                  setFaultForm({
                    ...faultForm,
                    severity: v as "low" | "medium" | "high" | "critical",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    {t("maintenance.severity.low")}
                  </SelectItem>
                  <SelectItem value="medium">
                    {t("maintenance.severity.medium")}
                  </SelectItem>
                  <SelectItem value="high">
                    {t("maintenance.severity.high")}
                  </SelectItem>
                  <SelectItem value="critical">
                    {t("maintenance.severity.critical")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("common.status")}</Label>
              <Select
                value={faultForm.status}
                onValueChange={(v) =>
                  setFaultForm({
                    ...faultForm,
                    status: v as "open" | "in_progress" | "resolved",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">
                    {t("maintenance.faultStatus.open")}
                  </SelectItem>
                  <SelectItem value="in_progress">
                    {t("maintenance.faultStatus.in_progress")}
                  </SelectItem>
                  <SelectItem value="resolved">
                    {t("maintenance.faultStatus.resolved")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setFaultDialog(false)}
                data-ocid="maintenance.faults.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={saveFault}
                data-ocid="maintenance.faults.save_button"
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
