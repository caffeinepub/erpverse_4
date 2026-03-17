import { CheckCircle, GitMerge, Plus, XCircle } from "lucide-react";
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
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

type ApprovalType = "purchase" | "leave" | "invoice";
type ApprovalStatus = "pending" | "approved" | "rejected" | "partial";

interface ApprovalStep {
  level: number;
  role: string;
  status: "pending" | "approved" | "rejected";
  comment?: string;
  decidedAt?: string;
}

interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  title: string;
  description: string;
  requester: string;
  createdAt: string;
  status: ApprovalStatus;
  steps: ApprovalStep[];
  currentLevel: number;
}

const TYPE_LABELS: Record<ApprovalType, string> = {
  purchase: "approval.type.purchase",
  leave: "approval.type.leave",
  invoice: "approval.type.invoice",
};

const STATUS_COLORS: Record<ApprovalStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  approved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
  partial: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

const APPROVAL_CHAIN: ApprovalStep[] = [
  { level: 1, role: "Yönetici", status: "pending" },
  { level: 2, role: "Sahip", status: "pending" },
];

export default function MultiLevelApprovalModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const { addNotification } = useNotifications();
  const companyId = company?.id || "default";

  const [requests, setRequests] = useLocalStorage<ApprovalRequest[]>(
    `erpverse_approvals_${companyId}`,
    [],
  );

  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [commentInput, setCommentInput] = useState("");

  const [form, setForm] = useState({
    type: "purchase" as ApprovalType,
    title: "",
    description: "",
    requester: "",
  });

  const handleCreate = () => {
    if (!form.title.trim() || !form.requester.trim()) return;
    const newReq: ApprovalRequest = {
      id: Date.now().toString(),
      ...form,
      createdAt: new Date().toISOString(),
      status: "pending",
      steps: APPROVAL_CHAIN.map((s) => ({ ...s })),
      currentLevel: 1,
    };
    setRequests((prev) => [newReq, ...prev]);
    addNotification({
      type: "approval_required",
      title: t("approval.new"),
      message: `${form.title} - ${t("approval.level")} 1: Yönetici`,
      companyId,
      targetRole: "manager",
    });
    setForm({ type: "purchase", title: "", description: "", requester: "" });
    setShowCreate(false);
  };

  const handleDecision = (
    req: ApprovalRequest,
    decision: "approved" | "rejected",
  ) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== req.id) return r;
        const updatedSteps = r.steps.map((s) =>
          s.level === r.currentLevel
            ? {
                ...s,
                status: decision,
                comment: commentInput,
                decidedAt: new Date().toISOString(),
              }
            : s,
        );
        const nextLevel = r.currentLevel + 1;
        const hasNext = nextLevel <= r.steps.length && decision === "approved";
        let newStatus: ApprovalStatus = decision;
        if (hasNext) newStatus = "partial";
        if (decision === "approved" && !hasNext) newStatus = "approved";
        if (decision === "rejected") newStatus = "rejected";

        if (hasNext) {
          addNotification({
            type: "approval_required",
            title: t("approval.new"),
            message: `${r.title} - ${t("approval.level")} ${nextLevel}: ${updatedSteps.find((s) => s.level === nextLevel)?.role}`,
            companyId,
            targetRole: "owner",
          });
        }

        return {
          ...r,
          steps: updatedSteps,
          currentLevel: hasNext ? nextLevel : r.currentLevel,
          status: newStatus,
        };
      }),
    );
    setCommentInput("");
    setSelected(null);
  };

  const statusLabel = (s: ApprovalStatus) => {
    const map: Record<ApprovalStatus, string> = {
      pending: t("approval.status.pending"),
      approved: t("approval.status.approved"),
      rejected: t("approval.status.rejected"),
      partial: t("approval.status.partial"),
    };
    return map[s];
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <GitMerge className="w-6 h-6 text-violet-400" />
            {t("modules.Approvals")}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {t("approval.subtitle")}
          </p>
        </div>
        <Button
          className="bg-violet-600 hover:bg-violet-700 text-white"
          onClick={() => setShowCreate(true)}
          data-ocid="approval.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("approval.create")}
        </Button>
      </div>

      {requests.length === 0 ? (
        <div
          className="text-center py-16 text-slate-500"
          data-ocid="approval.empty_state"
        >
          <GitMerge className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{t("approval.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req, i) => (
            <div
              key={req.id}
              className="bg-slate-800 rounded-xl border border-white/5 p-5 hover:border-violet-500/30 transition-colors"
              data-ocid={`approval.item.${i + 1}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className="text-xs border-violet-500/30 text-violet-300"
                    >
                      {t(TYPE_LABELS[req.type])}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${STATUS_COLORS[req.status]}`}
                    >
                      {statusLabel(req.status)}
                    </Badge>
                  </div>
                  <p className="text-white font-medium">{req.title}</p>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {t("approval.requester")}: {req.requester} •{" "}
                    {new Date(req.createdAt).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                {req.status === "pending" || req.status === "partial" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-violet-500/40 text-violet-300 hover:bg-violet-500/10 ml-4"
                    onClick={() => {
                      setSelected(req);
                      setCommentInput("");
                    }}
                    data-ocid={`approval.review_button.${i + 1}`}
                  >
                    {t("approval.review")}
                  </Button>
                ) : null}
              </div>

              {/* Approval chain visualization */}
              <div className="flex items-center gap-2 mt-4">
                {req.steps.map((step, si) => (
                  <div key={step.level} className="flex items-center gap-2">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                        step.status === "approved"
                          ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                          : step.status === "rejected"
                            ? "bg-red-500/20 border-red-500/30 text-red-300"
                            : step.level === req.currentLevel &&
                                (req.status === "pending" ||
                                  req.status === "partial")
                              ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-300"
                              : "bg-slate-700 border-slate-600 text-slate-400"
                      }`}
                    >
                      {step.status === "approved" ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : step.status === "rejected" ? (
                        <XCircle className="w-3 h-3" />
                      ) : (
                        <span className="w-3 h-3 rounded-full border border-current inline-block" />
                      )}
                      {t("approval.level")} {step.level}: {step.role}
                    </div>
                    {si < req.steps.length - 1 && (
                      <span className="text-slate-600">→</span>
                    )}
                  </div>
                ))}
              </div>
              {req.description && (
                <p className="text-slate-500 text-sm mt-2">{req.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-md"
          data-ocid="approval.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("approval.create")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("approval.type")}
              </Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, type: v as ApprovalType }))
                }
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="approval.type_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="purchase" className="text-white">
                    {t("approval.type.purchase")}
                  </SelectItem>
                  <SelectItem value="leave" className="text-white">
                    {t("approval.type.leave")}
                  </SelectItem>
                  <SelectItem value="invoice" className="text-white">
                    {t("approval.type.invoice")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("approval.title")}
              </Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                data-ocid="approval.title_input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("approval.requester")}
              </Label>
              <Input
                value={form.requester}
                onChange={(e) =>
                  setForm((p) => ({ ...p, requester: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                data-ocid="approval.requester_input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("approval.description")}
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                rows={3}
                data-ocid="approval.description_textarea"
              />
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-slate-400 text-xs mb-2">
                {t("approval.chainInfo")}
              </p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-yellow-300">Adım 1: Yönetici</span>
                <span className="text-slate-500">→</span>
                <span className="text-violet-300">Adım 2: Sahip</span>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowCreate(false)}
                data-ocid="approval.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                onClick={handleCreate}
                disabled={!form.title.trim() || !form.requester.trim()}
                data-ocid="approval.submit_button"
              >
                {t("approval.create")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent
            className="bg-slate-800 border-white/10 text-white max-w-md"
            data-ocid="approval.review_dialog"
          >
            <DialogHeader>
              <DialogTitle className="text-white">
                {t("approval.review")} – {t("approval.level")}{" "}
                {selected.currentLevel}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="bg-slate-700/50 rounded-lg p-3 space-y-1">
                <p className="text-white font-medium">{selected.title}</p>
                <p className="text-slate-400 text-sm">
                  {t("approval.requester")}: {selected.requester}
                </p>
                {selected.description && (
                  <p className="text-slate-400 text-sm">
                    {selected.description}
                  </p>
                )}
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">
                  {t("approval.currentStep")}:
                </p>
                <p className="text-violet-300 font-medium">
                  {t("approval.level")} {selected.currentLevel}:{" "}
                  {
                    selected.steps.find(
                      (s) => s.level === selected.currentLevel,
                    )?.role
                  }
                </p>
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("approval.comment")}
                </Label>
                <Textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  rows={2}
                  placeholder={t("approval.commentPlaceholder")}
                  data-ocid="approval.comment_textarea"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => handleDecision(selected, "rejected")}
                  data-ocid="approval.reject_button"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {t("approval.reject")}
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleDecision(selected, "approved")}
                  data-ocid="approval.approve_button"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t("approval.approve")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
