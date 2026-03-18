import {
  AlertTriangle,
  CheckCircle,
  Circle,
  ClipboardList,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useLanguage } from "../contexts/LanguageContext";

interface CountSession {
  id: string;
  name: string;
  date: string;
  status: "draft" | "completed";
  items: CountItem[];
}

interface CountItem {
  productId: string;
  productName: string;
  expectedQty: number;
  countedQty: number;
}

interface InventoryProduct {
  id: string;
  name: string;
  quantity: number;
}

export default function PhysicalInventoryModule() {
  const { t } = useLanguage();
  const companyId = localStorage.getItem("erpverse_selected_company") || "";
  const STORAGE_KEY = `erp_physical_inventory_${companyId}`;

  const [sessions, setSessions] = useState<CountSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");

  const saveSessions = (data: CountSession[]) => {
    setSessions(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const getInventoryProducts = (): InventoryProduct[] => {
    try {
      const raw = localStorage.getItem(`erp_inventory_${companyId}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed.map((p: any) => ({
        id: p.id,
        name: p.name,
        quantity: Number(p.quantity) || 0,
      }));
    } catch {
      return [];
    }
  };

  const createSession = () => {
    if (!newName.trim()) return;
    const session: CountSession = {
      id: Date.now().toString(),
      name: newName.trim(),
      date: newDate,
      status: "draft",
      items: [],
    };
    saveSessions([...sessions, session]);
    setNewName("");
    setNewDate(new Date().toISOString().split("T")[0]);
    setShowNewForm(false);
    setSelectedSession(session.id);
  };

  const deleteSession = (id: string) => {
    saveSessions(sessions.filter((s) => s.id !== id));
    if (selectedSession === id) setSelectedSession(null);
  };

  const addProductToSession = () => {
    if (!selectedSession || !selectedProductId) return;
    const products = getInventoryProducts();
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    const currentSession = sessions.find((s) => s.id === selectedSession);
    if (!currentSession) return;
    if (currentSession.items.some((i) => i.productId === selectedProductId)) {
      setShowAddProduct(false);
      setSelectedProductId("");
      return;
    }
    const item: CountItem = {
      productId: product.id,
      productName: product.name,
      expectedQty: product.quantity,
      countedQty: product.quantity,
    };
    const updated = sessions.map((s) =>
      s.id === selectedSession ? { ...s, items: [...s.items, item] } : s,
    );
    saveSessions(updated);
    setShowAddProduct(false);
    setSelectedProductId("");
  };

  const updateCountedQty = (productId: string, value: string) => {
    if (!selectedSession) return;
    const qty = Number(value);
    if (Number.isNaN(qty) || qty < 0) return;
    const updated = sessions.map((s) =>
      s.id === selectedSession
        ? {
            ...s,
            items: s.items.map((item) =>
              item.productId === productId
                ? { ...item, countedQty: qty }
                : item,
            ),
          }
        : s,
    );
    saveSessions(updated);
  };

  const removeItemFromSession = (productId: string) => {
    if (!selectedSession) return;
    const updated = sessions.map((s) =>
      s.id === selectedSession
        ? { ...s, items: s.items.filter((i) => i.productId !== productId) }
        : s,
    );
    saveSessions(updated);
  };

  const completeSession = () => {
    if (!selectedSession) return;
    const updated = sessions.map((s) =>
      s.id === selectedSession ? { ...s, status: "completed" as const } : s,
    );
    saveSessions(updated);
  };

  const currentSession = sessions.find((s) => s.id === selectedSession);
  const inventoryProducts = getInventoryProducts();
  const availableProducts = inventoryProducts.filter(
    (p) => !currentSession?.items.some((i) => i.productId === p.id),
  );

  const totalExcess =
    currentSession?.items.reduce(
      (sum, item) => sum + Math.max(0, item.countedQty - item.expectedQty),
      0,
    ) ?? 0;
  const totalMissing =
    currentSession?.items.reduce(
      (sum, item) => sum + Math.max(0, item.expectedQty - item.countedQty),
      0,
    ) ?? 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {t("physicalInventory")}
            </h2>
            <p className="text-slate-400 text-sm">
              {t("physicalInventory.subtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sessions List */}
        <div className="w-72 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-300 text-sm font-medium">
              {t("physicalInventory.sessions")}
            </span>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs px-2"
              onClick={() => setShowNewForm(true)}
              data-ocid="physinv.open_modal_button"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {t("newCountSession")}
            </Button>
          </div>

          {showNewForm && (
            <div
              className="bg-slate-800 rounded-xl border border-white/10 p-4 mb-3"
              data-ocid="physinv.dialog"
            >
              <div className="space-y-3">
                <div>
                  <Label className="text-slate-300 text-xs mb-1 block">
                    {t("countName")}
                  </Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white h-8 text-sm"
                    placeholder={t("countName")}
                    data-ocid="physinv.input"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs mb-1 block">
                    {t("countDate")}
                  </Label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="bg-white/5 border-white/10 text-white h-8 text-sm"
                    data-ocid="physinv.date_input"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-white/10 text-slate-300 h-7 text-xs"
                    onClick={() => setShowNewForm(false)}
                    data-ocid="physinv.cancel_button"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
                    onClick={createSession}
                    disabled={!newName.trim()}
                    data-ocid="physinv.submit_button"
                  >
                    {t("common.save")}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {sessions.length === 0 && !showNewForm && (
              <div
                className="text-center py-8 text-slate-500 text-sm"
                data-ocid="physinv.empty_state"
              >
                <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                {t("noCountSessions")}
              </div>
            )}
            {sessions.map((session, i) => (
              <button
                type="button"
                key={session.id}
                className={`w-full text-left rounded-lg border p-3 cursor-pointer transition-all ${
                  selectedSession === session.id
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-white/10 bg-slate-800 hover:border-white/20"
                }`}
                onClick={() => setSelectedSession(session.id)}
                data-ocid={`physinv.item.${i + 1}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {session.name}
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {session.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Badge
                      className={`text-xs border-0 ${
                        session.status === "completed"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-yellow-500/20 text-yellow-300"
                      }`}
                    >
                      {session.status === "completed"
                        ? t("completed")
                        : t("draft")}
                    </Badge>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="text-slate-500 hover:text-red-400 transition-colors p-0.5"
                      data-ocid={`physinv.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-slate-500 text-xs mt-1">
                  {session.items.length} ürün
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Session Detail */}
        <div className="flex-1 min-w-0">
          {!currentSession ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <ClipboardList className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">{t("physicalInventory.selectSession")}</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {currentSession.name}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {currentSession.date}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {currentSession.status === "draft" && (
                    <>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        onClick={() => setShowAddProduct(true)}
                        data-ocid="physinv.add_product_button"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        {t("addProduct")}
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                        onClick={completeSession}
                        disabled={currentSession.items.length === 0}
                        data-ocid="physinv.complete_button"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        {t("completeCount")}
                      </Button>
                    </>
                  )}
                  {currentSession.status === "completed" && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-0">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {t("completed")}
                    </Badge>
                  )}
                </div>
              </div>

              {showAddProduct && (
                <div
                  className="bg-slate-800 rounded-xl border border-white/10 p-4 mb-4"
                  data-ocid="physinv.add_product_panel"
                >
                  <p className="text-slate-300 text-sm font-medium mb-3">
                    {t("addProduct")}
                  </p>
                  {availableProducts.length === 0 ? (
                    <p className="text-slate-500 text-sm">
                      {t("physicalInventory.noProducts")}
                    </p>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm"
                        data-ocid="physinv.select"
                      >
                        <option value="">
                          {t("physicalInventory.selectProduct")}
                        </option>
                        {availableProducts.map((p) => (
                          <option
                            key={p.id}
                            value={p.id}
                            className="bg-slate-800"
                          >
                            {p.name} ({t("expectedQty")}: {p.quantity})
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        onClick={addProductToSession}
                        disabled={!selectedProductId}
                        data-ocid="physinv.add_product_confirm_button"
                      >
                        {t("addProduct")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 text-slate-300 text-xs"
                        onClick={() => {
                          setShowAddProduct(false);
                          setSelectedProductId("");
                        }}
                        data-ocid="physinv.add_product_cancel_button"
                      >
                        {t("common.cancel")}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {currentSession.items.length === 0 ? (
                <div
                  className="text-center py-12 text-slate-500"
                  data-ocid="physinv.items.empty_state"
                >
                  <Circle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">{t("physicalInventory.noItems")}</p>
                </div>
              ) : (
                <>
                  <div className="bg-slate-800 rounded-xl border border-white/10 overflow-hidden mb-4">
                    <table className="w-full" data-ocid="physinv.table">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                            {t("physicalInventory.product")}
                          </th>
                          <th className="text-center text-slate-400 text-xs font-medium px-4 py-3">
                            {t("expectedQty")}
                          </th>
                          <th className="text-center text-slate-400 text-xs font-medium px-4 py-3">
                            {t("countedQty")}
                          </th>
                          <th className="text-center text-slate-400 text-xs font-medium px-4 py-3">
                            {t("difference")}
                          </th>
                          {currentSession.status === "draft" && (
                            <th className="px-4 py-3" />
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {currentSession.items.map((item, i) => {
                          const diff = item.countedQty - item.expectedQty;
                          return (
                            <tr
                              key={item.productId}
                              className="border-b border-white/5 last:border-0"
                              data-ocid={`physinv.row.${i + 1}`}
                            >
                              <td className="px-4 py-3">
                                <span className="text-white text-sm">
                                  {item.productName}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-slate-300 text-sm">
                                  {item.expectedQty}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {currentSession.status === "draft" ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    value={item.countedQty}
                                    onChange={(e) =>
                                      updateCountedQty(
                                        item.productId,
                                        e.target.value,
                                      )
                                    }
                                    className="bg-white/5 border-white/10 text-white h-7 text-sm w-20 mx-auto text-center"
                                    data-ocid={`physinv.counted_input.${i + 1}`}
                                  />
                                ) : (
                                  <span className="text-slate-300 text-sm">
                                    {item.countedQty}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`text-sm font-semibold ${
                                    diff === 0
                                      ? "text-emerald-400"
                                      : diff < 0
                                        ? "text-red-400"
                                        : "text-orange-400"
                                  }`}
                                >
                                  {diff > 0 ? `+${diff}` : diff}
                                </span>
                              </td>
                              {currentSession.status === "draft" && (
                                <td className="px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeItemFromSession(item.productId)
                                    }
                                    className="text-slate-500 hover:text-red-400 transition-colors"
                                    data-ocid={`physinv.remove_item_button.${i + 1}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        <span className="text-orange-300 text-sm font-medium">
                          {t("excessItems")}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-orange-300">
                        {totalExcess}
                      </p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-red-300 text-sm font-medium">
                          {t("missingItems")}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-red-300">
                        {totalMissing}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
