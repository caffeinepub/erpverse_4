import { useState } from "react";
import { useAuditLog } from "../contexts/AuditLogContext";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

type PositionStatus = "open" | "closed" | "onHold";
type CandidateStage =
  | "applied"
  | "reviewing"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";
type InterviewResult = "pending" | "passed" | "failed";

interface Position {
  id: string;
  companyId: string;
  title: string;
  department: string;
  skills: string;
  description: string;
  status: PositionStatus;
  createdAt: string;
}

interface Candidate {
  id: string;
  companyId: string;
  positionId: string;
  name: string;
  email: string;
  phone: string;
  applicationDate: string;
  stage: CandidateStage;
  notes: string;
}

interface Interview {
  id: string;
  companyId: string;
  candidateId: string;
  positionId: string;
  interviewDate: string;
  interviewer: string;
  result: InterviewResult;
  notes: string;
}

function getStorageKey(key: string, companyId: string) {
  return `erp_${key}_${companyId}`;
}

function loadFromStorage<T>(key: string, companyId: string): T[] {
  try {
    const raw = localStorage.getItem(getStorageKey(key, companyId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, companyId: string, data: T[]) {
  localStorage.setItem(getStorageKey(key, companyId), JSON.stringify(data));
}

const STAGES: CandidateStage[] = [
  "applied",
  "reviewing",
  "interview",
  "offer",
  "hired",
  "rejected",
];

const STAGE_COLORS: Record<CandidateStage, string> = {
  applied: "bg-slate-700 text-slate-200",
  reviewing: "bg-blue-900 text-blue-200",
  interview: "bg-purple-900 text-purple-200",
  offer: "bg-yellow-900 text-yellow-200",
  hired: "bg-green-900 text-green-200",
  rejected: "bg-red-900 text-red-200",
};

const STATUS_COLORS: Record<PositionStatus, string> = {
  open: "bg-green-900 text-green-200",
  closed: "bg-red-900 text-red-200",
  onHold: "bg-yellow-900 text-yellow-200",
};

const RESULT_COLORS: Record<InterviewResult, string> = {
  pending: "bg-slate-700 text-slate-300",
  passed: "bg-green-900 text-green-200",
  failed: "bg-red-900 text-red-200",
};

export default function RecruitmentModule() {
  const { t } = useLanguage();
  const { addLog } = useAuditLog();
  const { company } = useAuth();
  const companyId = company?.id ?? "";

  const [activeTab, setActiveTab] = useState<
    "positions" | "candidates" | "interviews"
  >("positions");

  // Positions state
  const [positions, setPositions] = useState<Position[]>(() =>
    loadFromStorage<Position>("recruitment_positions", companyId),
  );
  const [showPositionForm, setShowPositionForm] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [posForm, setPosForm] = useState({
    title: "",
    department: "",
    skills: "",
    description: "",
    status: "open" as PositionStatus,
  });

  // Candidates state
  const [candidates, setCandidates] = useState<Candidate[]>(() =>
    loadFromStorage<Candidate>("recruitment_candidates", companyId),
  );
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(
    null,
  );
  const [candForm, setCandForm] = useState({
    positionId: "",
    name: "",
    email: "",
    phone: "",
    applicationDate: new Date().toISOString().slice(0, 10),
    stage: "applied" as CandidateStage,
    notes: "",
  });
  const [selectedPositionFilter, setSelectedPositionFilter] = useState("");

  // Interviews state
  const [interviews, setInterviews] = useState<Interview[]>(() =>
    loadFromStorage<Interview>("recruitment_interviews", companyId),
  );
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [intForm, setIntForm] = useState({
    candidateId: "",
    positionId: "",
    interviewDate: "",
    interviewer: "",
    result: "pending" as InterviewResult,
    notes: "",
  });

  // Summary stats
  const totalPositions = positions.length;
  const openPositions = positions.filter((p) => p.status === "open").length;
  const totalCandidates = candidates.length;
  const hiredCount = candidates.filter((c) => c.stage === "hired").length;

  // ─── Position handlers
  const savePositions = (data: Position[]) => {
    setPositions(data);
    saveToStorage("recruitment_positions", companyId, data);
  };

  const handleAddPosition = () => {
    if (!posForm.title || !posForm.department) return;
    if (editingPosition) {
      const updated = positions.map((p) =>
        p.id === editingPosition.id ? { ...p, ...posForm } : p,
      );
      savePositions(updated);
      addLog({
        module: "recruitment",
        action: "update",
        detail: `Pozisyon güncellendi: ${posForm.title}`,
      });
    } else {
      const newPos: Position = {
        id: `POS${Date.now()}`,
        companyId,
        ...posForm,
        createdAt: new Date().toLocaleDateString("tr-TR"),
      };
      const updated = [newPos, ...positions];
      savePositions(updated);
      addLog({
        module: "recruitment",
        action: "create",
        detail: `Pozisyon oluşturuldu: ${posForm.title}`,
      });
    }
    setShowPositionForm(false);
    setEditingPosition(null);
    setPosForm({
      title: "",
      department: "",
      skills: "",
      description: "",
      status: "open",
    });
  };

  const handleDeletePosition = (id: string) => {
    const pos = positions.find((p) => p.id === id);
    savePositions(positions.filter((p) => p.id !== id));
    addLog({
      module: "recruitment",
      action: "delete",
      detail: `Pozisyon silindi: ${pos?.title}`,
    });
  };

  const handleEditPosition = (p: Position) => {
    setEditingPosition(p);
    setPosForm({
      title: p.title,
      department: p.department,
      skills: p.skills,
      description: p.description,
      status: p.status,
    });
    setShowPositionForm(true);
  };

  // ─── Candidate handlers
  const saveCandidates = (data: Candidate[]) => {
    setCandidates(data);
    saveToStorage("recruitment_candidates", companyId, data);
  };

  const handleAddCandidate = () => {
    if (!candForm.name || !candForm.positionId) return;
    if (editingCandidate) {
      const updated = candidates.map((c) =>
        c.id === editingCandidate.id ? { ...c, ...candForm } : c,
      );
      saveCandidates(updated);
      addLog({
        module: "recruitment",
        action: "update",
        detail: `Aday güncellendi: ${candForm.name}`,
      });
    } else {
      const newCand: Candidate = {
        id: `CAND${Date.now()}`,
        companyId,
        ...candForm,
      };
      saveCandidates([newCand, ...candidates]);
      addLog({
        module: "recruitment",
        action: "create",
        detail: `Aday eklendi: ${candForm.name}`,
      });
    }
    setShowCandidateForm(false);
    setEditingCandidate(null);
    setCandForm({
      positionId: "",
      name: "",
      email: "",
      phone: "",
      applicationDate: new Date().toISOString().slice(0, 10),
      stage: "applied",
      notes: "",
    });
  };

  const handleDeleteCandidate = (id: string) => {
    const cand = candidates.find((c) => c.id === id);
    saveCandidates(candidates.filter((c) => c.id !== id));
    addLog({
      module: "recruitment",
      action: "delete",
      detail: `Aday silindi: ${cand?.name}`,
    });
  };

  const handleEditCandidate = (c: Candidate) => {
    setEditingCandidate(c);
    setCandForm({
      positionId: c.positionId,
      name: c.name,
      email: c.email,
      phone: c.phone,
      applicationDate: c.applicationDate,
      stage: c.stage,
      notes: c.notes,
    });
    setShowCandidateForm(true);
  };

  // ─── Interview handlers
  const saveInterviews = (data: Interview[]) => {
    setInterviews(data);
    saveToStorage("recruitment_interviews", companyId, data);
  };

  const handleAddInterview = () => {
    if (!intForm.candidateId || !intForm.interviewDate || !intForm.interviewer)
      return;
    const cand = candidates.find((c) => c.id === intForm.candidateId);
    const newInt: Interview = {
      id: `INT${Date.now()}`,
      companyId,
      ...intForm,
    };
    saveInterviews([newInt, ...interviews]);
    addLog({
      module: "recruitment",
      action: "create",
      detail: `Mülakat planlandı: ${cand?.name} - ${intForm.interviewDate}`,
    });
    setShowInterviewForm(false);
    setIntForm({
      candidateId: "",
      positionId: "",
      interviewDate: "",
      interviewer: "",
      result: "pending",
      notes: "",
    });
  };

  const handleUpdateInterviewResult = (id: string, result: InterviewResult) => {
    const updated = interviews.map((i) => (i.id === id ? { ...i, result } : i));
    saveInterviews(updated);
    addLog({
      module: "recruitment",
      action: "update",
      detail: `Mülakat sonucu güncellendi: ${result}`,
    });
  };

  const handleDeleteInterview = (id: string) => {
    saveInterviews(interviews.filter((i) => i.id !== id));
    addLog({
      module: "recruitment",
      action: "delete",
      detail: "Mülakat silindi",
    });
  };

  const filteredCandidates = selectedPositionFilter
    ? candidates.filter((c) => c.positionId === selectedPositionFilter)
    : candidates;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          {t("recruitment.title")}
        </h2>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: t("recruitment.totalPositions"),
            value: totalPositions,
            color: "from-blue-600 to-blue-800",
          },
          {
            label: t("recruitment.openPositions"),
            value: openPositions,
            color: "from-green-600 to-green-800",
          },
          {
            label: t("recruitment.totalCandidates"),
            value: totalCandidates,
            color: "from-purple-600 to-purple-800",
          },
          {
            label: t("recruitment.hiredCount"),
            value: hiredCount,
            color: "from-emerald-600 to-emerald-800",
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.color} rounded-xl p-4`}
          >
            <div className="text-3xl font-bold text-white">{card.value}</div>
            <div className="text-sm text-white/80 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-0">
        {(["positions", "candidates", "interviews"] as const).map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {t(`recruitment.${tab}`)}
          </button>
        ))}
      </div>

      {/* ── POSITIONS TAB ── */}
      {activeTab === "positions" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setEditingPosition(null);
                setPosForm({
                  title: "",
                  department: "",
                  skills: "",
                  description: "",
                  status: "open",
                });
                setShowPositionForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              + {t("recruitment.newPosition")}
            </button>
          </div>

          {/* Position form */}
          {showPositionForm && (
            <div className="bg-slate-800 rounded-xl p-5 space-y-3 border border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="block text-xs text-slate-400 mb-1">
                    {t("recruitment.positionTitle")} *
                  </span>
                  <input
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    value={posForm.title}
                    onChange={(e) =>
                      setPosForm({ ...posForm, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <span className="block text-xs text-slate-400 mb-1">
                    {t("recruitment.department")} *
                  </span>
                  <input
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    value={posForm.department}
                    onChange={(e) =>
                      setPosForm({ ...posForm, department: e.target.value })
                    }
                  />
                </div>
                <div>
                  <span className="block text-xs text-slate-400 mb-1">
                    {t("recruitment.skills")}
                  </span>
                  <input
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    value={posForm.skills}
                    onChange={(e) =>
                      setPosForm({ ...posForm, skills: e.target.value })
                    }
                    placeholder="React, TypeScript, ..."
                  />
                </div>
                <div>
                  <span className="block text-xs text-slate-400 mb-1">
                    {t("recruitment.statusLabel")}
                  </span>
                  <select
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    value={posForm.status}
                    onChange={(e) =>
                      setPosForm({
                        ...posForm,
                        status: e.target.value as PositionStatus,
                      })
                    }
                  >
                    <option value="open">{t("recruitment.open")}</option>
                    <option value="closed">{t("recruitment.closed")}</option>
                    <option value="onHold">{t("recruitment.onHold")}</option>
                  </select>
                </div>
              </div>
              <div>
                <span className="block text-xs text-slate-400 mb-1">
                  {t("recruitment.description")}
                </span>
                <textarea
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  rows={3}
                  value={posForm.description}
                  onChange={(e) =>
                    setPosForm({ ...posForm, description: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddPosition}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {editingPosition ? t("common.save") : t("common.add")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPositionForm(false)}
                  className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg text-sm"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          )}

          {/* Positions list */}
          {positions.length === 0 ? (
            <div className="text-center text-slate-500 py-12">
              {t("recruitment.noPositions")}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {positions.map((pos) => {
                const posCandidates = candidates.filter(
                  (c) => c.positionId === pos.id,
                );
                return (
                  <div
                    key={pos.id}
                    className="bg-slate-800 rounded-xl p-5 border border-slate-700 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-white font-semibold text-base">
                          {pos.title}
                        </h3>
                        <p className="text-slate-400 text-sm">
                          {pos.department}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          STATUS_COLORS[pos.status]
                        }`}
                      >
                        {t(`recruitment.${pos.status}`)}
                      </span>
                    </div>
                    {pos.skills && (
                      <div className="flex flex-wrap gap-1">
                        {pos.skills.split(",").map((s) => (
                          <span
                            key={s}
                            className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full"
                          >
                            {s.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    {pos.description && (
                      <p className="text-slate-400 text-xs">
                        {pos.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {posCandidates.length} {t("recruitment.candidates")}
                      </span>
                      <span>{pos.createdAt}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditPosition(pos)}
                        className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-lg"
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePosition(pos.id)}
                        className="text-xs bg-red-900 hover:bg-red-800 text-red-200 px-3 py-1 rounded-lg"
                      >
                        {t("common.delete")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CANDIDATES TAB ── */}
      {activeTab === "candidates" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <select
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
              value={selectedPositionFilter}
              onChange={(e) => setSelectedPositionFilter(e.target.value)}
            >
              <option value="">
                {t("recruitment.positions")} ({t("common.all") ?? "Tümü"})
              </option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setEditingCandidate(null);
                setCandForm({
                  positionId: "",
                  name: "",
                  email: "",
                  phone: "",
                  applicationDate: new Date().toISOString().slice(0, 10),
                  stage: "applied",
                  notes: "",
                });
                setShowCandidateForm(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              + {t("recruitment.addCandidate")}
            </button>
          </div>

          {/* Candidate form */}
          {showCandidateForm && (
            <div className="bg-slate-800 rounded-xl p-5 space-y-3 border border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="block text-xs text-slate-400 mb-1">
                    {t("recruitment.positionFor")} *
                  </span>
                  <select
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    value={candForm.positionId}
                    onChange={(e) =>
                      setCandForm({ ...candForm, positionId: e.target.value })
                    }
                  >
                    <option value="">--</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="block text-xs text-slate-400 mb-1">
                    {t("recruitment.candidateName")} *
                  </span>
                  <input
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    value={candForm.name}
                    onChange={(e) =>
                      setCandForm({ ...candForm, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <span className="block text-xs text-slate-400 mb-1">
                    {t("recruitment.email")}
                  </span>
                  <input
                    type="email"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    value={candForm.email}
                    onChange={(e) =>
                      setCandForm({ ...candForm, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <span className="block text-xs text-slate-400 mb-1">
                    {t("recruitment.phone")}
                  </span>
                  <input
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    value={candForm.phone}
                    onChange={(e) =>
                      setCandForm({ ...candForm, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <span className="block text-xs text-slate-400 mb-1">
                    {t("recruitment.applicationDate")}
                  </span>
                  <input
                    type="date"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    value={candForm.applicationDate}
                    onChange={(e) =>
                      setCandForm({
                        ...candForm,
                        applicationDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <span className="block text-xs text-slate-400 mb-1">
                    {t("recruitment.statusLabel")}
                  </span>
                  <select
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    value={candForm.stage}
                    onChange={(e) =>
                      setCandForm({
                        ...candForm,
                        stage: e.target.value as CandidateStage,
                      })
                    }
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {t(
                          s === "interview"
                            ? "recruitment.interviewStage"
                            : `recruitment.${s}`,
                        )}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <span className="block text-xs text-slate-400 mb-1">
                  {t("recruitment.notes")}
                </span>
                <textarea
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  rows={2}
                  value={candForm.notes}
                  onChange={(e) =>
                    setCandForm({ ...candForm, notes: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddCandidate}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {editingCandidate ? t("common.save") : t("common.add")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCandidateForm(false)}
                  className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg text-sm"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          )}

          {/* Kanban-style stage columns */}
          {filteredCandidates.length === 0 ? (
            <div className="text-center text-slate-500 py-12">
              {t("recruitment.noCandidates")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex gap-3 min-w-max pb-2">
                {STAGES.map((stage) => {
                  const stageCandidates = filteredCandidates.filter(
                    (c) => c.stage === stage,
                  );
                  const stageLabel =
                    stage === "interview"
                      ? t("recruitment.interviewStage")
                      : t(`recruitment.${stage}`);
                  return (
                    <div key={stage} className="w-48 flex-shrink-0">
                      <div
                        className={`text-xs font-medium px-2 py-1 rounded-lg mb-2 text-center ${
                          STAGE_COLORS[stage]
                        }`}
                      >
                        {stageLabel} ({stageCandidates.length})
                      </div>
                      <div className="space-y-2">
                        {stageCandidates.map((cand) => {
                          const pos = positions.find(
                            (p) => p.id === cand.positionId,
                          );
                          return (
                            <div
                              key={cand.id}
                              className="bg-slate-800 rounded-lg p-3 border border-slate-700 text-xs"
                            >
                              <p className="text-white font-medium text-sm">
                                {cand.name}
                              </p>
                              {pos && (
                                <p className="text-slate-400">{pos.title}</p>
                              )}
                              {cand.email && (
                                <p className="text-slate-500 truncate">
                                  {cand.email}
                                </p>
                              )}
                              <p className="text-slate-500 mt-1">
                                {cand.applicationDate}
                              </p>
                              <div className="flex gap-1 mt-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditCandidate(cand)}
                                  className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-0.5 rounded text-xs"
                                >
                                  {t("common.edit")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCandidate(cand.id)}
                                  className="bg-red-900 hover:bg-red-800 text-red-200 px-2 py-0.5 rounded text-xs"
                                >
                                  {t("common.delete")}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── INTERVIEWS TAB ── */}
      {activeTab === "interviews" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setIntForm({
                  candidateId: "",
                  positionId: "",
                  interviewDate: "",
                  interviewer: "",
                  result: "pending",
                  notes: "",
                });
                setShowInterviewForm(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              + {t("recruitment.scheduleInterview")}
            </button>
          </div>

          {/* Interview form */}
          {showInterviewForm && (
            <div className="bg-slate-800 rounded-xl p-5 space-y-3 border border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="block text-xs text-slate-400 mb-1">
                    {t("recruitment.candidates")} *
                  </span>
                  <select
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    value={intForm.candidateId}
                    onChange={(e) => {
                      const cand = candidates.find(
                        (c) => c.id === e.target.value,
                      );
                      setIntForm({
                        ...intForm,
                        candidateId: e.target.value,
                        positionId: cand?.positionId ?? "",
                      });
                    }}
                  >
                    <option value="">--</option>
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="block text-xs text-slate-400 mb-1">
                    {t("recruitment.interviewer")} *
                  </span>
                  <input
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    value={intForm.interviewer}
                    onChange={(e) =>
                      setIntForm({ ...intForm, interviewer: e.target.value })
                    }
                  />
                </div>
                <div>
                  <span className="block text-xs text-slate-400 mb-1">
                    {t("recruitment.interviewDate")} *
                  </span>
                  <input
                    type="datetime-local"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    value={intForm.interviewDate}
                    onChange={(e) =>
                      setIntForm({ ...intForm, interviewDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <span className="block text-xs text-slate-400 mb-1">
                    {t("recruitment.result")}
                  </span>
                  <select
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    value={intForm.result}
                    onChange={(e) =>
                      setIntForm({
                        ...intForm,
                        result: e.target.value as InterviewResult,
                      })
                    }
                  >
                    <option value="pending">{t("recruitment.pending")}</option>
                    <option value="passed">{t("recruitment.passed")}</option>
                    <option value="failed">{t("recruitment.failed")}</option>
                  </select>
                </div>
              </div>
              <div>
                <span className="block text-xs text-slate-400 mb-1">
                  {t("recruitment.notes")}
                </span>
                <textarea
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  rows={2}
                  value={intForm.notes}
                  onChange={(e) =>
                    setIntForm({ ...intForm, notes: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddInterview}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {t("common.add")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInterviewForm(false)}
                  className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg text-sm"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          )}

          {/* Interviews list */}
          {interviews.length === 0 ? (
            <div className="text-center text-slate-500 py-12">
              {t("recruitment.noInterviews")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="text-left py-3 px-4">
                      {t("recruitment.candidates")}
                    </th>
                    <th className="text-left py-3 px-4">
                      {t("recruitment.positionFor")}
                    </th>
                    <th className="text-left py-3 px-4">
                      {t("recruitment.interviewDate")}
                    </th>
                    <th className="text-left py-3 px-4">
                      {t("recruitment.interviewer")}
                    </th>
                    <th className="text-left py-3 px-4">
                      {t("recruitment.result")}
                    </th>
                    <th className="text-right py-3 px-4">
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.map((interview) => {
                    const cand = candidates.find(
                      (c) => c.id === interview.candidateId,
                    );
                    const pos = positions.find(
                      (p) => p.id === interview.positionId,
                    );
                    return (
                      <tr
                        key={interview.id}
                        className="border-b border-slate-800 hover:bg-slate-800/50"
                      >
                        <td className="py-3 px-4 text-white font-medium">
                          {cand?.name ?? "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {pos?.title ?? "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {interview.interviewDate.replace("T", " ")}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {interview.interviewer}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            className={`text-xs px-2 py-1 rounded-lg border-0 ${
                              RESULT_COLORS[interview.result]
                            }`}
                            value={interview.result}
                            onChange={(e) =>
                              handleUpdateInterviewResult(
                                interview.id,
                                e.target.value as InterviewResult,
                              )
                            }
                          >
                            <option value="pending">
                              {t("recruitment.pending")}
                            </option>
                            <option value="passed">
                              {t("recruitment.passed")}
                            </option>
                            <option value="failed">
                              {t("recruitment.failed")}
                            </option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteInterview(interview.id)}
                            className="text-xs bg-red-900 hover:bg-red-800 text-red-200 px-3 py-1 rounded-lg"
                          >
                            {t("common.delete")}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
