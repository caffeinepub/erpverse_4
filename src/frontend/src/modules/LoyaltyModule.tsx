import {
  Award,
  Gift,
  History,
  Plus,
  Star,
  ToggleLeft,
  ToggleRight,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

interface LoyaltyCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalPoints: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  joinDate: string;
}

interface PointTransaction {
  id: string;
  customerId: string;
  customerName: string;
  type: "earn" | "redeem" | "expire" | "adjust";
  points: number;
  reason: string;
  date: string;
}

interface RewardDefinition {
  id: string;
  name: string;
  requiredPoints: number;
  description: string;
  active: boolean;
}

interface LoyaltyData {
  customers: LoyaltyCustomer[];
  transactions: PointTransaction[];
  rewards: RewardDefinition[];
}

const STORAGE_KEY = "erpverse_loyalty";

function getTier(points: number): "bronze" | "silver" | "gold" | "platinum" {
  if (points >= 15000) return "platinum";
  if (points >= 5000) return "gold";
  if (points >= 1000) return "silver";
  return "bronze";
}

const TIER_COLORS: Record<string, string> = {
  bronze: "bg-amber-700/30 text-amber-400 border border-amber-600/30",
  silver: "bg-slate-600/30 text-slate-300 border border-slate-500/30",
  gold: "bg-yellow-600/30 text-yellow-400 border border-yellow-500/30",
  platinum: "bg-violet-600/30 text-violet-400 border border-violet-500/30",
};

const TYPE_COLORS: Record<string, string> = {
  earn: "bg-emerald-700/30 text-emerald-400",
  redeem: "bg-blue-700/30 text-blue-400",
  expire: "bg-red-700/30 text-red-400",
  adjust: "bg-orange-700/30 text-orange-400",
};

export default function LoyaltyModule() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    "customers" | "history" | "rewards"
  >("customers");
  const [data, setData] = useState<LoyaltyData>({
    customers: [],
    transactions: [],
    rewards: [],
  });

  // Customer form
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [custForm, setCustForm] = useState({ name: "", email: "", phone: "" });

  // Point form
  const [selectedCustomer, setSelectedCustomer] =
    useState<LoyaltyCustomer | null>(null);
  const [showPointForm, setShowPointForm] = useState(false);
  const [pointForm, setPointForm] = useState({
    type: "earn" as PointTransaction["type"],
    points: "",
    reason: "",
  });

  // Reward form
  const [showAddReward, setShowAddReward] = useState(false);
  const [rewardForm, setRewardForm] = useState({
    name: "",
    requiredPoints: "",
    description: "",
  });

  // History filter
  const [historyFilter, setHistoryFilter] = useState<
    "all" | PointTransaction["type"]
  >("all");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch (_) {
        // ignore
      }
    }
  }, []);

  function save(updated: LoyaltyData) {
    setData(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function addCustomer() {
    if (!custForm.name.trim()) return;
    const customer: LoyaltyCustomer = {
      id: Date.now().toString(),
      name: custForm.name.trim(),
      email: custForm.email.trim(),
      phone: custForm.phone.trim(),
      totalPoints: 0,
      tier: "bronze",
      joinDate: new Date().toISOString().slice(0, 10),
    };
    save({ ...data, customers: [...data.customers, customer] });
    setCustForm({ name: "", email: "", phone: "" });
    setShowAddCustomer(false);
  }

  function applyPoints() {
    if (!selectedCustomer || !pointForm.points || !pointForm.reason.trim())
      return;
    const amount = Number.parseInt(pointForm.points);
    if (Number.isNaN(amount)) return;
    const delta =
      pointForm.type === "earn" || pointForm.type === "adjust"
        ? amount
        : -Math.abs(amount);
    const transaction: PointTransaction = {
      id: Date.now().toString(),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      type: pointForm.type,
      points:
        pointForm.type === "earn" || pointForm.type === "adjust"
          ? amount
          : -Math.abs(amount),
      reason: pointForm.reason.trim(),
      date: new Date().toISOString().slice(0, 10),
    };
    const updatedCustomers = data.customers.map((c) => {
      if (c.id !== selectedCustomer.id) return c;
      const newPoints = Math.max(0, c.totalPoints + delta);
      return { ...c, totalPoints: newPoints, tier: getTier(newPoints) };
    });
    save({
      ...data,
      customers: updatedCustomers,
      transactions: [transaction, ...data.transactions],
    });
    setPointForm({ type: "earn", points: "", reason: "" });
    setShowPointForm(false);
    setSelectedCustomer(
      updatedCustomers.find((c) => c.id === selectedCustomer.id) || null,
    );
  }

  function addReward() {
    if (!rewardForm.name.trim() || !rewardForm.requiredPoints) return;
    const reward: RewardDefinition = {
      id: Date.now().toString(),
      name: rewardForm.name.trim(),
      requiredPoints: Number.parseInt(rewardForm.requiredPoints) || 0,
      description: rewardForm.description.trim(),
      active: true,
    };
    save({ ...data, rewards: [...data.rewards, reward] });
    setRewardForm({ name: "", requiredPoints: "", description: "" });
    setShowAddReward(false);
  }

  function toggleReward(id: string) {
    save({
      ...data,
      rewards: data.rewards.map((r) =>
        r.id === id ? { ...r, active: !r.active } : r,
      ),
    });
  }

  function deleteReward(id: string) {
    save({ ...data, rewards: data.rewards.filter((r) => r.id !== id) });
  }

  const filteredHistory =
    historyFilter === "all"
      ? data.transactions
      : data.transactions.filter((t) => t.type === historyFilter);
  const customerHistory = selectedCustomer
    ? data.transactions.filter((t) => t.customerId === selectedCustomer.id)
    : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
          <Gift className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {t("loyalty.title")}
          </h1>
          <p className="text-slate-400 text-sm">{t("loyalty.subtitle")}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {(["customers", "history", "rewards"] as const).map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            data-ocid={`loyalty.${tab}_tab`}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
              activeTab === tab
                ? "bg-pink-600/20 text-pink-400 border-b-2 border-pink-500"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab === "customers"
              ? t("loyalty.customers")
              : tab === "history"
                ? t("loyalty.history")
                : t("loyalty.rewards")}
          </button>
        ))}
      </div>

      {/* Customers Tab */}
      {activeTab === "customers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">
              {data.customers.length} {t("loyalty.customers")}
            </span>
            <button
              type="button"
              onClick={() => setShowAddCustomer(true)}
              data-ocid="loyalty.open_modal_button"
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t("loyalty.addCustomer")}
            </button>
          </div>

          {/* Add Customer Form */}
          {showAddCustomer && (
            <div
              className="bg-slate-800 rounded-xl p-4 border border-white/10 space-y-3"
              data-ocid="loyalty.dialog"
            >
              <h3 className="text-white font-semibold">
                {t("loyalty.addCustomer")}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  className="bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                  placeholder={t("loyalty.customerName")}
                  value={custForm.name}
                  onChange={(e) =>
                    setCustForm({ ...custForm, name: e.target.value })
                  }
                  data-ocid="loyalty.input"
                />
                <input
                  className="bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                  placeholder={t("loyalty.email")}
                  value={custForm.email}
                  onChange={(e) =>
                    setCustForm({ ...custForm, email: e.target.value })
                  }
                  data-ocid="loyalty.input"
                />
                <input
                  className="bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                  placeholder={t("loyalty.phone")}
                  value={custForm.phone}
                  onChange={(e) =>
                    setCustForm({ ...custForm, phone: e.target.value })
                  }
                  data-ocid="loyalty.input"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addCustomer}
                  data-ocid="loyalty.submit_button"
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm rounded-lg transition-colors"
                >
                  {t("loyalty.addCustomer")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  data-ocid="loyalty.cancel_button"
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          )}

          {/* Customer list */}
          {data.customers.length === 0 ? (
            <div
              className="text-center py-16 text-slate-500"
              data-ocid="loyalty.empty_state"
            >
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t("loyalty.noCustomers")}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {data.customers.map((c, i) => (
                <div
                  key={c.id}
                  data-ocid={`loyalty.item.${i + 1}`}
                  className="bg-slate-800 rounded-xl p-4 border border-white/10 hover:border-pink-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{c.name}</p>
                        <p className="text-slate-400 text-xs">
                          {c.email} {c.phone && `· ${c.phone}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-white font-bold text-lg">
                          {c.totalPoints.toLocaleString()}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {t("loyalty.points")}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${TIER_COLORS[c.tier]}`}
                      >
                        {t(`loyalty.${c.tier}`)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setShowPointForm(true);
                        }}
                        data-ocid={`loyalty.edit_button.${i + 1}`}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Star className="w-3 h-3" />
                        {t("loyalty.addPoints")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Point adjust form */}
          {showPointForm && selectedCustomer && (
            <div
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
              data-ocid="loyalty.modal"
            >
              <div className="bg-slate-800 rounded-2xl p-6 border border-white/10 w-full max-w-md space-y-4 mx-4">
                <h3 className="text-white font-semibold text-lg">
                  {t("loyalty.addPoints")} – {selectedCustomer.name}
                </h3>
                <p className="text-slate-400 text-sm">
                  {t("loyalty.totalPoints")}:{" "}
                  <span className="text-white font-bold">
                    {selectedCustomer.totalPoints.toLocaleString()}
                  </span>
                </p>

                <div className="space-y-3">
                  <select
                    className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
                    value={pointForm.type}
                    onChange={(e) =>
                      setPointForm({
                        ...pointForm,
                        type: e.target.value as PointTransaction["type"],
                      })
                    }
                    data-ocid="loyalty.select"
                  >
                    <option value="earn">{t("loyalty.earn")}</option>
                    <option value="redeem">{t("loyalty.redeem")}</option>
                    <option value="expire">{t("loyalty.expire")}</option>
                    <option value="adjust">{t("loyalty.adjust")}</option>
                  </select>
                  <input
                    type="number"
                    className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                    placeholder={t("loyalty.pointAmount")}
                    value={pointForm.points}
                    onChange={(e) =>
                      setPointForm({ ...pointForm, points: e.target.value })
                    }
                    data-ocid="loyalty.input"
                  />
                  <input
                    className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                    placeholder={t("loyalty.reason")}
                    value={pointForm.reason}
                    onChange={(e) =>
                      setPointForm({ ...pointForm, reason: e.target.value })
                    }
                    data-ocid="loyalty.input"
                  />
                </div>

                {/* Customer history */}
                {customerHistory.length > 0 && (
                  <div className="border-t border-white/10 pt-3 max-h-40 overflow-y-auto space-y-1">
                    <p className="text-slate-400 text-xs mb-2">
                      {t("loyalty.pointHistory")}
                    </p>
                    {customerHistory.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <span
                          className={`px-2 py-0.5 rounded ${TYPE_COLORS[tx.type]}`}
                        >
                          {t(`loyalty.${tx.type}`)}
                        </span>
                        <span className="text-slate-300">{tx.reason}</span>
                        <span
                          className={
                            tx.points >= 0 ? "text-emerald-400" : "text-red-400"
                          }
                        >
                          {tx.points >= 0 ? "+" : ""}
                          {tx.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={applyPoints}
                    data-ocid="loyalty.confirm_button"
                    className="flex-1 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm rounded-lg transition-colors"
                  >
                    {t("loyalty.addPoints")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPointForm(false);
                      setSelectedCustomer(null);
                    }}
                    data-ocid="loyalty.close_button"
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {(["all", "earn", "redeem", "expire", "adjust"] as const).map(
              (f) => (
                <button
                  type="button"
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  data-ocid={`loyalty.${f}_tab`}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    historyFilter === f
                      ? "bg-pink-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white border border-white/10"
                  }`}
                >
                  {f === "all" ? "Tümü" : t(`loyalty.${f}`)}
                </button>
              ),
            )}
          </div>

          {filteredHistory.length === 0 ? (
            <div
              className="text-center py-16 text-slate-500"
              data-ocid="loyalty.empty_state"
            >
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t("loyalty.noHistory")}</p>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm" data-ocid="loyalty.table">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-slate-400 font-medium">
                      {t("loyalty.customerName")}
                    </th>
                    <th className="px-4 py-3 text-left text-slate-400 font-medium">
                      {t("loyalty.tier")}
                    </th>
                    <th className="px-4 py-3 text-left text-slate-400 font-medium">
                      {t("loyalty.points")}
                    </th>
                    <th className="px-4 py-3 text-left text-slate-400 font-medium">
                      {t("loyalty.reason")}
                    </th>
                    <th className="px-4 py-3 text-left text-slate-400 font-medium">
                      {t("loyalty.joinDate")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((tx, i) => (
                    <tr
                      key={tx.id}
                      data-ocid={`loyalty.row.${i + 1}`}
                      className="border-b border-white/5 hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-white">
                        {tx.customerName}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[tx.type]}`}
                        >
                          {t(`loyalty.${tx.type}`)}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 font-bold ${tx.points >= 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {tx.points >= 0 ? "+" : ""}
                        {tx.points}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{tx.reason}</td>
                      <td className="px-4 py-3 text-slate-400">{tx.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === "rewards" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">
              {data.rewards.length} {t("loyalty.rewards")}
            </span>
            <button
              type="button"
              onClick={() => setShowAddReward(true)}
              data-ocid="loyalty.open_modal_button"
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t("loyalty.addReward")}
            </button>
          </div>

          {showAddReward && (
            <div
              className="bg-slate-800 rounded-xl p-4 border border-white/10 space-y-3"
              data-ocid="loyalty.dialog"
            >
              <h3 className="text-white font-semibold">
                {t("loyalty.addReward")}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  className="bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                  placeholder={t("loyalty.rewardName")}
                  value={rewardForm.name}
                  onChange={(e) =>
                    setRewardForm({ ...rewardForm, name: e.target.value })
                  }
                  data-ocid="loyalty.input"
                />
                <input
                  type="number"
                  className="bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                  placeholder={t("loyalty.requiredPoints")}
                  value={rewardForm.requiredPoints}
                  onChange={(e) =>
                    setRewardForm({
                      ...rewardForm,
                      requiredPoints: e.target.value,
                    })
                  }
                  data-ocid="loyalty.input"
                />
                <input
                  className="bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                  placeholder={t("loyalty.description")}
                  value={rewardForm.description}
                  onChange={(e) =>
                    setRewardForm({
                      ...rewardForm,
                      description: e.target.value,
                    })
                  }
                  data-ocid="loyalty.input"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addReward}
                  data-ocid="loyalty.submit_button"
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm rounded-lg transition-colors"
                >
                  {t("loyalty.addReward")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddReward(false)}
                  data-ocid="loyalty.cancel_button"
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          )}

          {data.rewards.length === 0 ? (
            <div
              className="text-center py-16 text-slate-500"
              data-ocid="loyalty.empty_state"
            >
              <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t("loyalty.noRewards")}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {data.rewards.map((r, i) => (
                <div
                  key={r.id}
                  data-ocid={`loyalty.item.${i + 1}`}
                  className="bg-slate-800 rounded-xl p-4 border border-white/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        r.active
                          ? "bg-pink-600/20 text-pink-400"
                          : "bg-slate-700 text-slate-500"
                      }`}
                    >
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{r.name}</p>
                      <p className="text-slate-400 text-xs">{r.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-yellow-400 font-bold">
                        {r.requiredPoints.toLocaleString()}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {t("loyalty.requiredPoints")}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.active
                          ? "bg-emerald-700/30 text-emerald-400"
                          : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {r.active ? t("loyalty.active") : t("loyalty.inactive")}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleReward(r.id)}
                      data-ocid={`loyalty.toggle.${i + 1}`}
                      className="text-slate-400 hover:text-white transition-colors"
                      title={
                        r.active ? t("loyalty.inactive") : t("loyalty.active")
                      }
                    >
                      {r.active ? (
                        <ToggleRight className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteReward(r.id)}
                      data-ocid={`loyalty.delete_button.${i + 1}`}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
