import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

interface EFaturaItem {
  id: string;
  urunAdi: string;
  miktar: number;
  birimFiyat: number;
  kdvOrani: number;
}

interface EFatura {
  id: string;
  faturaNo: string;
  tip: "efatura" | "earchiv";
  aliciVkn: string;
  aliciUnvan: string;
  faturaTarihi: string;
  vadeTarihi: string;
  kalemler: EFaturaItem[];
  notlar: string;
  durum: "Taslak" | "Gönderildi" | "İptal";
  olusturmaTarihi: string;
}

const LS_KEY = "erpverse_efatura";

function loadFaturalar(): EFatura[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveFaturalar(list: EFatura[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

function genFaturaNo(tip: "efatura" | "earchiv") {
  const prefix = tip === "efatura" ? "EF" : "EA";
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${ymd}-${rand}`;
}

function calcTotal(kalemler: EFaturaItem[]) {
  return kalemler.reduce((sum, k) => {
    const net = k.miktar * k.birimFiyat;
    return sum + net + net * (k.kdvOrani / 100);
  }, 0);
}

export default function EFaturaModule() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"efatura" | "earchiv">("efatura");
  const [faturalar, setFaturalar] = useState<EFatura[]>(loadFaturalar);
  const [showForm, setShowForm] = useState(false);
  const [selectedFatura, setSelectedFatura] = useState<EFatura | null>(null);

  const emptyItem = (): EFaturaItem => ({
    id: crypto.randomUUID(),
    urunAdi: "",
    miktar: 1,
    birimFiyat: 0,
    kdvOrani: 18,
  });

  const [form, setForm] = useState({
    aliciVkn: "",
    aliciUnvan: "",
    faturaTarihi: new Date().toISOString().split("T")[0],
    vadeTarihi: "",
    notlar: "",
    kalemler: [emptyItem()],
  });

  const listed = faturalar.filter((f) => f.tip === activeTab);

  const handleAddItem = () => {
    setForm((prev) => ({ ...prev, kalemler: [...prev.kalemler, emptyItem()] }));
  };

  const handleRemoveItem = (id: string) => {
    setForm((prev) => ({
      ...prev,
      kalemler: prev.kalemler.filter((k) => k.id !== id),
    }));
  };

  const handleItemChange = (
    id: string,
    field: keyof EFaturaItem,
    value: string | number,
  ) => {
    setForm((prev) => ({
      ...prev,
      kalemler: prev.kalemler.map((k) =>
        k.id === id
          ? {
              ...k,
              [field]:
                typeof value === "string" && field !== "urunAdi"
                  ? Number(value)
                  : value,
            }
          : k,
      ),
    }));
  };

  const handleSave = () => {
    if (
      !form.aliciVkn ||
      !form.aliciUnvan ||
      form.kalemler.some((k) => !k.urunAdi)
    )
      return;
    const newFatura: EFatura = {
      id: crypto.randomUUID(),
      faturaNo: genFaturaNo(activeTab),
      tip: activeTab,
      aliciVkn: form.aliciVkn,
      aliciUnvan: form.aliciUnvan,
      faturaTarihi: form.faturaTarihi,
      vadeTarihi: form.vadeTarihi,
      notlar: form.notlar,
      kalemler: form.kalemler,
      durum: "Taslak",
      olusturmaTarihi: new Date().toISOString(),
    };
    const updated = [newFatura, ...faturalar];
    setFaturalar(updated);
    saveFaturalar(updated);
    setShowForm(false);
    setForm({
      aliciVkn: "",
      aliciUnvan: "",
      faturaTarihi: new Date().toISOString().split("T")[0],
      vadeTarihi: "",
      notlar: "",
      kalemler: [emptyItem()],
    });
  };

  const handleStatusChange = (id: string, durum: EFatura["durum"]) => {
    const updated = faturalar.map((f) => (f.id === id ? { ...f, durum } : f));
    setFaturalar(updated);
    saveFaturalar(updated);
    if (selectedFatura?.id === id)
      setSelectedFatura((prev) => (prev ? { ...prev, durum } : null));
  };

  const handleDelete = (id: string) => {
    const updated = faturalar.filter((f) => f.id !== id);
    setFaturalar(updated);
    saveFaturalar(updated);
    if (selectedFatura?.id === id) setSelectedFatura(null);
  };

  const handleDownloadGIB = (fatura: EFatura) => {
    const net = fatura.kalemler.reduce(
      (s, k) => s + k.miktar * k.birimFiyat,
      0,
    );
    const kdv = fatura.kalemler.reduce(
      (s, k) => s + k.miktar * k.birimFiyat * (k.kdvOrani / 100),
      0,
    );
    const gibObj = {
      "UBL-TR": {
        FaturaNo: fatura.faturaNo,
        FaturaTarihi: fatura.faturaTarihi,
        VadeTarihi: fatura.vadeTarihi,
        AliciVKN: fatura.aliciVkn,
        AliciUnvan: fatura.aliciUnvan,
        FaturaLinelari: fatura.kalemler.map((k) => ({
          UrunAdi: k.urunAdi,
          Miktar: k.miktar,
          BirimFiyat: k.birimFiyat,
          KDVOrani: k.kdvOrani,
          KDVTutari: ((k.miktar * k.birimFiyat * k.kdvOrani) / 100).toFixed(2),
          ToplamTutar: (
            k.miktar *
            k.birimFiyat *
            (1 + k.kdvOrani / 100)
          ).toFixed(2),
        })),
        MatrahToplami: net.toFixed(2),
        ToplamKDV: kdv.toFixed(2),
        GenelToplam: (net + kdv).toFixed(2),
        Notlar: fatura.notlar,
      },
    };
    const blob = new Blob([JSON.stringify(gibObj, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fatura.faturaNo}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusColor = (d: EFatura["durum"]) =>
    d === "Taslak"
      ? "bg-gray-100 text-gray-700"
      : d === "Gönderildi"
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {t("efatura.title")}
        </h2>
        <p className="text-gray-500 text-sm mt-1">{t("efatura.subtitle")}</p>
      </div>

      <div className="flex gap-2 mb-6 border-b">
        {(["efatura", "earchiv"] as const).map((tp) => (
          <button
            type="button"
            key={tp}
            onClick={() => {
              setActiveTab(tp);
              setSelectedFatura(null);
              setShowForm(false);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tp
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tp === "efatura"
              ? t("efatura.efaturaTab")
              : t("efatura.earchivTab")}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">
              {listed.length} {t("efatura.record")}
            </span>
            <button
              type="button"
              onClick={() => {
                setShowForm(true);
                setSelectedFatura(null);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 flex items-center gap-2"
            >
              <span>+</span> {t("efatura.newFatura")}
            </button>
          </div>

          {listed.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">📄</div>
              <p>{t("efatura.empty")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {listed.map((f) => (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => {
                    setSelectedFatura(f);
                    setShowForm(false);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedFatura?.id === f.id
                      ? "border-purple-400 bg-purple-50"
                      : "border-gray-200 bg-white hover:border-purple-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">
                        {f.faturaNo}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {f.aliciUnvan}
                      </div>
                      <div className="text-xs text-gray-400">
                        {f.faturaTarihi}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(f.durum)}`}
                      >
                        {f.durum}
                      </span>
                      <div className="text-sm font-bold text-gray-800 mt-1">
                        {calcTotal(f.kalemler).toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        ₺
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {(selectedFatura || showForm) && (
          <div className="w-96 bg-white border border-gray-200 rounded-xl p-5 self-start sticky top-6">
            {showForm ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">
                    {t("efatura.newFatura")}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="ef-vkn"
                      className="text-xs text-gray-500 block mb-1"
                    >
                      {t("efatura.aliciVkn")} *
                    </label>
                    <input
                      id="ef-vkn"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={form.aliciVkn}
                      onChange={(e) =>
                        setForm({ ...form, aliciVkn: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="ef-unvan"
                      className="text-xs text-gray-500 block mb-1"
                    >
                      {t("efatura.aliciUnvan")} *
                    </label>
                    <input
                      id="ef-unvan"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={form.aliciUnvan}
                      onChange={(e) =>
                        setForm({ ...form, aliciUnvan: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="ef-tarih"
                        className="text-xs text-gray-500 block mb-1"
                      >
                        {t("efatura.faturaTarihi")}
                      </label>
                      <input
                        id="ef-tarih"
                        type="date"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={form.faturaTarihi}
                        onChange={(e) =>
                          setForm({ ...form, faturaTarihi: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="ef-vade"
                        className="text-xs text-gray-500 block mb-1"
                      >
                        {t("efatura.vadeTarihi")}
                      </label>
                      <input
                        id="ef-vade"
                        type="date"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={form.vadeTarihi}
                        onChange={(e) =>
                          setForm({ ...form, vadeTarihi: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      {t("efatura.kalemler")}
                    </p>
                    <div className="space-y-2">
                      {form.kalemler.map((k, idx) => (
                        <div
                          key={k.id}
                          className="border rounded-lg p-2 bg-gray-50"
                        >
                          <div className="flex gap-1 mb-1">
                            <input
                              placeholder={t("efatura.urunAdi")}
                              className="flex-1 border rounded px-2 py-1 text-xs"
                              value={k.urunAdi}
                              onChange={(e) =>
                                handleItemChange(
                                  k.id,
                                  "urunAdi",
                                  e.target.value,
                                )
                              }
                              aria-label={`${t("efatura.urunAdi")} ${idx + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(k.id)}
                              className="text-red-400 hover:text-red-600 text-xs px-1"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <input
                              type="number"
                              placeholder={t("efatura.miktar")}
                              className="border rounded px-2 py-1 text-xs"
                              value={k.miktar}
                              onChange={(e) =>
                                handleItemChange(k.id, "miktar", e.target.value)
                              }
                              aria-label={`${t("efatura.miktar")} ${idx + 1}`}
                            />
                            <input
                              type="number"
                              placeholder={t("efatura.birimFiyat")}
                              className="border rounded px-2 py-1 text-xs"
                              value={k.birimFiyat}
                              onChange={(e) =>
                                handleItemChange(
                                  k.id,
                                  "birimFiyat",
                                  e.target.value,
                                )
                              }
                              aria-label={`${t("efatura.birimFiyat")} ${idx + 1}`}
                            />
                            <select
                              className="border rounded px-2 py-1 text-xs"
                              value={k.kdvOrani}
                              onChange={(e) =>
                                handleItemChange(
                                  k.id,
                                  "kdvOrani",
                                  e.target.value,
                                )
                              }
                              aria-label={`KDV ${idx + 1}`}
                            >
                              {[0, 1, 8, 10, 18, 20].map((r) => (
                                <option key={r} value={r}>
                                  %{r}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="mt-2 text-xs text-purple-600 hover:underline"
                    >
                      + {t("efatura.addItem")}
                    </button>
                  </div>

                  <div>
                    <label
                      htmlFor="ef-notlar"
                      className="text-xs text-gray-500 block mb-1"
                    >
                      {t("efatura.notlar")}
                    </label>
                    <textarea
                      id="ef-notlar"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      rows={2}
                      value={form.notlar}
                      onChange={(e) =>
                        setForm({ ...form, notlar: e.target.value })
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSave}
                    className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 font-medium"
                  >
                    {t("efatura.save")}
                  </button>
                </div>
              </>
            ) : selectedFatura ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">
                    {selectedFatura.faturaNo}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedFatura(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("efatura.durum")}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(selectedFatura.durum)}`}
                    >
                      {selectedFatura.durum}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      {t("efatura.aliciVkn")}
                    </span>
                    <span className="font-medium">
                      {selectedFatura.aliciVkn}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      {t("efatura.aliciUnvan")}
                    </span>
                    <span className="font-medium text-right max-w-40 break-words">
                      {selectedFatura.aliciUnvan}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      {t("efatura.faturaTarihi")}
                    </span>
                    <span>{selectedFatura.faturaTarihi}</span>
                  </div>
                  {selectedFatura.vadeTarihi && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        {t("efatura.vadeTarihi")}
                      </span>
                      <span>{selectedFatura.vadeTarihi}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2 font-medium">
                    {t("efatura.kalemler")}
                  </p>
                  <div className="space-y-1">
                    {selectedFatura.kalemler.map((k) => {
                      const net = k.miktar * k.birimFiyat;
                      const kdv = net * (k.kdvOrani / 100);
                      return (
                        <div
                          key={k.id}
                          className="bg-gray-50 rounded p-2 text-xs"
                        >
                          <div className="font-medium">{k.urunAdi}</div>
                          <div className="text-gray-500">
                            {k.miktar} × {k.birimFiyat.toLocaleString("tr-TR")}{" "}
                            ₺ | KDV %{k.kdvOrani} ={" "}
                            {kdv.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            ₺
                          </div>
                          <div className="font-semibold text-right">
                            {(net + kdv).toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            ₺
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between font-bold mt-3 pt-2 border-t">
                    <span>{t("efatura.genelToplam")}</span>
                    <span className="text-purple-700">
                      {calcTotal(selectedFatura.kalemler).toLocaleString(
                        "tr-TR",
                        { minimumFractionDigits: 2 },
                      )}{" "}
                      ₺
                    </span>
                  </div>
                </div>

                {selectedFatura.notlar && (
                  <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded p-2">
                    {selectedFatura.notlar}
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  <p className="text-xs text-gray-500 font-medium mb-1">
                    {t("efatura.durumGuncelle")}
                  </p>
                  <div className="flex gap-2">
                    {(
                      ["Taslak", "Gönderildi", "İptal"] as EFatura["durum"][]
                    ).map((d) => (
                      <button
                        type="button"
                        key={d}
                        onClick={() => handleStatusChange(selectedFatura.id, d)}
                        disabled={selectedFatura.durum === d}
                        className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                          selectedFatura.durum === d
                            ? "bg-purple-600 text-white"
                            : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadGIB(selectedFatura)}
                    className="w-full py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 font-medium"
                  >
                    📥 {t("efatura.gibIndir")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedFatura.id)}
                    className="w-full py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50"
                  >
                    {t("efatura.delete")}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
