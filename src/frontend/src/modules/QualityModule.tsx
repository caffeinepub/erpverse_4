import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Plus,
  ShieldAlert,
  XCircle,
} from "lucide-react";
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
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface QualityCheck {
  id: string;
  title: string;
  productProcess: string;
  status: "pending" | "passed" | "failed";
  date: string;
  notes: string;
}

interface NonConformanceReport {
  id: string;
  title: string;
  department: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "reviewing" | "closed";
  date: string;
}

export default function QualityModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const cid = company?.id || "default";

  const [checks, setChecks] = useLocalStorage<QualityCheck[]>(
    `erp_quality_${cid}`,
    [],
  );
  const [reports, setReports] = useLocalStorage<NonConformanceReport[]>(
    `erp_quality_reports_${cid}`,
    [],
  );

  const [showCheckDialog, setShowCheckDialog] = useState(false);
  const [editCheckId, setEditCheckId] = useState<string | null>(null);
  const [checkForm, setCheckForm] = useState({
    title: "",
    productProcess: "",
    status: "pending" as QualityCheck["status"],
    date: "",
    notes: "",
  });

  const [showReportDialog, setShowReportDialog] = useState(false);
  const [editReportId, setEditReportId] = useState<string | null>(null);
  const [reportForm, setReportForm] = useState({
    title: "",
    department: "",
    severity: "low" as NonConformanceReport["severity"],
    status: "open" as NonConformanceReport["status"],
    date: "",
  });

  const totalChecks = checks.length;
  const passedChecks = checks.filter((c) => c.status === "passed").length;
  const failedChecks = checks.filter((c) => c.status === "failed").length;
  const openReports = reports.filter((r) => r.status === "open").length;

  const openAddCheck = () => {
    setEditCheckId(null);
    setCheckForm({
      title: "",
      productProcess: "",
      status: "pending",
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setShowCheckDialog(true);
  };

  const openEditCheck = (c: QualityCheck) => {
    setEditCheckId(c.id);
    setCheckForm({
      title: c.title,
      productProcess: c.productProcess,
      status: c.status,
      date: c.date,
      notes: c.notes,
    });
    setShowCheckDialog(true);
  };

  const saveCheck = () => {
    if (!checkForm.title.trim()) return;
    if (editCheckId) {
      setChecks((prev) =>
        prev.map((c) => (c.id === editCheckId ? { ...c, ...checkForm } : c)),
      );
      toast.success(t("common.updated"));
    } else {
      setChecks((prev) => [
        ...prev,
        { id: Date.now().toString(), ...checkForm },
      ]);
      toast.success(t("common.added"));
    }
    setShowCheckDialog(false);
  };

  const deleteCheck = (id: string) => {
    setChecks((prev) => prev.filter((c) => c.id !== id));
    toast.success(t("common.deleted"));
  };

  const openAddReport = () => {
    setEditReportId(null);
    setReportForm({
      title: "",
      department: "",
      severity: "low",
      status: "open",
      date: new Date().toISOString().slice(0, 10),
    });
    setShowReportDialog(true);
  };

  const openEditReport = (r: NonConformanceReport) => {
    setEditReportId(r.id);
    setReportForm({
      title: r.title,
      department: r.department,
      severity: r.severity,
      status: r.status,
      date: r.date,
    });
    setShowReportDialog(true);
  };

  const saveReport = () => {
    if (!reportForm.title.trim()) return;
    if (editReportId) {
      setReports((prev) =>
        prev.map((r) => (r.id === editReportId ? { ...r, ...reportForm } : r)),
      );
      toast.success(t("common.updated"));
    } else {
      setReports((prev) => [
        ...prev,
        { id: Date.now().toString(), ...reportForm },
      ]);
      toast.success(t("common.added"));
    }
    setShowReportDialog(false);
  };

  const deleteReport = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast.success(t("common.deleted"));
  };

  const checkStatusBadge = (status: QualityCheck["status"]) => {
    if (status === "passed")
      return (
        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          {t("quality.passed")}
        </Badge>
      );
    if (status === "failed")
      return (
        <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
          <XCircle className="w-3 h-3 mr-1" />
          {t("quality.failed")}
        </Badge>
      );
    return (
      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
        <AlertTriangle className="w-3 h-3 mr-1" />
        {t("quality.pending")}
      </Badge>
    );
  };

  const severityBadge = (severity: NonConformanceReport["severity"]) => {
    const map = {
      low: "bg-slate-500/20 text-slate-300 border-slate-500/30",
      medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      high: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      critical: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    const labels = {
      low: t("quality.severityLow"),
      medium: t("quality.severityMedium"),
      high: t("quality.severityHigh"),
      critical: t("quality.severityCritical"),
    };
    return <Badge className={map[severity]}>{labels[severity]}</Badge>;
  };

  const reportStatusBadge = (status: NonConformanceReport["status"]) => {
    if (status === "closed")
      return (
        <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30">
          {t("quality.reportClosed")}
        </Badge>
      );
    if (status === "reviewing")
      return (
        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
          {t("quality.reportReviewing")}
        </Badge>
      );
    return (
      <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
        {t("quality.reportOpen")}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert className="w-7 h-7 text-rose-400" />
        <h2 className="text-2xl font-bold text-white">
          {t("modules.Quality")}
        </h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: t("quality.totalChecks"),
            value: totalChecks,
            color: "text-sky-400",
            bg: "bg-sky-500/10 border-sky-500/20",
          },
          {
            label: t("quality.passed"),
            value: passedChecks,
            color: "text-green-400",
            bg: "bg-green-500/10 border-green-500/20",
          },
          {
            label: t("quality.failed"),
            value: failedChecks,
            color: "text-red-400",
            bg: "bg-red-500/10 border-red-500/20",
          },
          {
            label: t("quality.openReports"),
            value: openReports,
            color: "text-orange-400",
            bg: "bg-orange-500/10 border-orange-500/20",
          },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} border rounded-xl p-4`}>
            <p className="text-slate-400 text-sm">{stat.label}</p>
            <p className={`${stat.color} text-3xl font-bold mt-1`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="checks">
        <TabsList className="bg-slate-800 border border-white/10">
          <TabsTrigger
            value="checks"
            data-ocid="quality.checks.tab"
            className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-300"
          >
            <ClipboardCheck className="w-4 h-4 mr-2" />
            {t("quality.checks")}
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            data-ocid="quality.reports.tab"
            className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-300"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {t("quality.ncReports")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checks">
          <div className="flex justify-end mb-3">
            <Button
              onClick={openAddCheck}
              className="bg-rose-500 hover:bg-rose-600 text-white"
              data-ocid="quality.check.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("quality.addCheck")}
            </Button>
          </div>
          {checks.length === 0 ? (
            <div
              className="text-center py-12 text-slate-500"
              data-ocid="quality.checks.empty_state"
            >
              <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{t("quality.noChecks")}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-400">
                      {t("quality.title")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("quality.productProcess")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("quality.status")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("quality.date")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("quality.notes")}
                    </TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checks.map((c, idx) => (
                    <TableRow
                      key={c.id}
                      className="border-white/5 hover:bg-white/5"
                      data-ocid={`quality.check.row.${idx + 1}`}
                    >
                      <TableCell className="text-white font-medium">
                        {c.title}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {c.productProcess}
                      </TableCell>
                      <TableCell>{checkStatusBadge(c.status)}</TableCell>
                      <TableCell className="text-slate-400">{c.date}</TableCell>
                      <TableCell className="text-slate-400 max-w-[150px] truncate">
                        {c.notes}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditCheck(c)}
                            data-ocid={`quality.check.edit_button.${idx + 1}`}
                            className="text-slate-400 hover:text-white"
                          >
                            {t("common.edit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteCheck(c.id)}
                            data-ocid={`quality.check.delete_button.${idx + 1}`}
                            className="text-red-400 hover:text-red-300"
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

        <TabsContent value="reports">
          <div className="flex justify-end mb-3">
            <Button
              onClick={openAddReport}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              data-ocid="quality.report.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("quality.addReport")}
            </Button>
          </div>
          {reports.length === 0 ? (
            <div
              className="text-center py-12 text-slate-500"
              data-ocid="quality.reports.empty_state"
            >
              <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{t("quality.noReports")}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-400">
                      {t("quality.title")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("quality.department")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("quality.severity")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("quality.status")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("quality.date")}
                    </TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r, idx) => (
                    <TableRow
                      key={r.id}
                      className="border-white/5 hover:bg-white/5"
                      data-ocid={`quality.report.row.${idx + 1}`}
                    >
                      <TableCell className="text-white font-medium">
                        {r.title}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {r.department}
                      </TableCell>
                      <TableCell>{severityBadge(r.severity)}</TableCell>
                      <TableCell>{reportStatusBadge(r.status)}</TableCell>
                      <TableCell className="text-slate-400">{r.date}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditReport(r)}
                            data-ocid={`quality.report.edit_button.${idx + 1}`}
                            className="text-slate-400 hover:text-white"
                          >
                            {t("common.edit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteReport(r.id)}
                            data-ocid={`quality.report.delete_button.${idx + 1}`}
                            className="text-red-400 hover:text-red-300"
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
      </Tabs>

      {/* Check Dialog */}
      <Dialog open={showCheckDialog} onOpenChange={setShowCheckDialog}>
        <DialogContent
          className="bg-slate-900 border-white/10 text-white"
          data-ocid="quality.check.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editCheckId ? t("quality.editCheck") : t("quality.addCheck")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">{t("quality.title")}</Label>
              <Input
                value={checkForm.title}
                onChange={(e) =>
                  setCheckForm((p) => ({ ...p, title: e.target.value }))
                }
                className="bg-slate-800 border-white/10 text-white mt-1"
                data-ocid="quality.check.title.input"
              />
            </div>
            <div>
              <Label className="text-slate-300">
                {t("quality.productProcess")}
              </Label>
              <Input
                value={checkForm.productProcess}
                onChange={(e) =>
                  setCheckForm((p) => ({
                    ...p,
                    productProcess: e.target.value,
                  }))
                }
                className="bg-slate-800 border-white/10 text-white mt-1"
                data-ocid="quality.check.product.input"
              />
            </div>
            <div>
              <Label className="text-slate-300">{t("quality.status")}</Label>
              <Select
                value={checkForm.status}
                onValueChange={(v) =>
                  setCheckForm((p) => ({
                    ...p,
                    status: v as QualityCheck["status"],
                  }))
                }
              >
                <SelectTrigger
                  className="bg-slate-800 border-white/10 text-white mt-1"
                  data-ocid="quality.check.status.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="pending" className="text-yellow-300">
                    {t("quality.pending")}
                  </SelectItem>
                  <SelectItem value="passed" className="text-green-300">
                    {t("quality.passed")}
                  </SelectItem>
                  <SelectItem value="failed" className="text-red-300">
                    {t("quality.failed")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">{t("quality.date")}</Label>
              <Input
                type="date"
                value={checkForm.date}
                onChange={(e) =>
                  setCheckForm((p) => ({ ...p, date: e.target.value }))
                }
                className="bg-slate-800 border-white/10 text-white mt-1"
                data-ocid="quality.check.date.input"
              />
            </div>
            <div>
              <Label className="text-slate-300">{t("quality.notes")}</Label>
              <Textarea
                value={checkForm.notes}
                onChange={(e) =>
                  setCheckForm((p) => ({ ...p, notes: e.target.value }))
                }
                className="bg-slate-800 border-white/10 text-white mt-1"
                data-ocid="quality.check.notes.textarea"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowCheckDialog(false)}
                data-ocid="quality.check.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-rose-500 hover:bg-rose-600"
                onClick={saveCheck}
                data-ocid="quality.check.submit_button"
              >
                {t("common.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent
          className="bg-slate-900 border-white/10 text-white"
          data-ocid="quality.report.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editReportId ? t("quality.editReport") : t("quality.addReport")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">{t("quality.title")}</Label>
              <Input
                value={reportForm.title}
                onChange={(e) =>
                  setReportForm((p) => ({ ...p, title: e.target.value }))
                }
                className="bg-slate-800 border-white/10 text-white mt-1"
                data-ocid="quality.report.title.input"
              />
            </div>
            <div>
              <Label className="text-slate-300">
                {t("quality.department")}
              </Label>
              <Input
                value={reportForm.department}
                onChange={(e) =>
                  setReportForm((p) => ({ ...p, department: e.target.value }))
                }
                className="bg-slate-800 border-white/10 text-white mt-1"
                data-ocid="quality.report.dept.input"
              />
            </div>
            <div>
              <Label className="text-slate-300">{t("quality.severity")}</Label>
              <Select
                value={reportForm.severity}
                onValueChange={(v) =>
                  setReportForm((p) => ({
                    ...p,
                    severity: v as NonConformanceReport["severity"],
                  }))
                }
              >
                <SelectTrigger
                  className="bg-slate-800 border-white/10 text-white mt-1"
                  data-ocid="quality.report.severity.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="low" className="text-slate-300">
                    {t("quality.severityLow")}
                  </SelectItem>
                  <SelectItem value="medium" className="text-yellow-300">
                    {t("quality.severityMedium")}
                  </SelectItem>
                  <SelectItem value="high" className="text-orange-300">
                    {t("quality.severityHigh")}
                  </SelectItem>
                  <SelectItem value="critical" className="text-red-300">
                    {t("quality.severityCritical")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">{t("quality.status")}</Label>
              <Select
                value={reportForm.status}
                onValueChange={(v) =>
                  setReportForm((p) => ({
                    ...p,
                    status: v as NonConformanceReport["status"],
                  }))
                }
              >
                <SelectTrigger
                  className="bg-slate-800 border-white/10 text-white mt-1"
                  data-ocid="quality.report.status.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="open" className="text-red-300">
                    {t("quality.reportOpen")}
                  </SelectItem>
                  <SelectItem value="reviewing" className="text-blue-300">
                    {t("quality.reportReviewing")}
                  </SelectItem>
                  <SelectItem value="closed" className="text-slate-300">
                    {t("quality.reportClosed")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">{t("quality.date")}</Label>
              <Input
                type="date"
                value={reportForm.date}
                onChange={(e) =>
                  setReportForm((p) => ({ ...p, date: e.target.value }))
                }
                className="bg-slate-800 border-white/10 text-white mt-1"
                data-ocid="quality.report.date.input"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowReportDialog(false)}
                data-ocid="quality.report.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                onClick={saveReport}
                data-ocid="quality.report.submit_button"
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
