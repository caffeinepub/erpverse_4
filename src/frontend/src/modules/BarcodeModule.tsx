import { Barcode, Edit2, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useLanguage } from "../contexts/LanguageContext";

interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  type?: string;
  unit?: string;
  price?: number;
  source: "inventory" | "catalog";
}

function generateSKU(id: string, name: string): string {
  const seed = (id + name).toUpperCase().replace(/[^A-Z0-9]/g, "");
  let result = "SKU-";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let i = 0; i < 6; i++) {
    result += chars[seed.charCodeAt(i % seed.length) % chars.length];
  }
  return result;
}

function BarcodeVisual({ sku }: { sku: string }) {
  const bars: { width: number; height: number }[] = [];
  for (let i = 0; i < 24; i++) {
    const charCode = sku.charCodeAt(i % sku.length);
    const width = [1, 1, 2, 1, 3, 1, 2, 1][charCode % 8];
    const height = 20 + (charCode % 12);
    bars.push({ width, height });
  }
  return (
    <div className="flex items-end gap-px h-8 bg-transparent">
      {bars.map((bar, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static deterministic bars
          key={i}
          className="bg-white"
          style={{
            width: `${bar.width * 2}px`,
            height: `${bar.height}px`,
          }}
        />
      ))}
    </div>
  );
}

export default function BarcodeModule() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"sku" | "search">("sku");
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<Product | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const inventory: Product[] = [];
    const catalog: Product[] = [];

    try {
      const inv = JSON.parse(localStorage.getItem("erpInventory") || "[]");
      for (const item of inv) {
        inventory.push({
          id: item.id || item.name,
          name: item.name || item.productName || "",
          sku: item.sku || "",
          category: item.category || "",
          unit: item.unit || "",
          price: item.price || 0,
          source: "inventory",
        });
      }
    } catch {}

    try {
      const cat = JSON.parse(localStorage.getItem("erpProductCatalog") || "[]");
      for (const item of cat) {
        catalog.push({
          id: item.id || item.name,
          name: item.name || "",
          sku: item.sku || item.code || "",
          type: item.type || "",
          price: item.price || 0,
          source: "catalog",
        });
      }
    } catch {}

    const all = [...inventory, ...catalog].map((p) => ({
      ...p,
      sku: p.sku || generateSKU(p.id, p.name),
    }));
    setProducts(all);
  }, []);

  function saveSKU(product: Product, newSku: string) {
    const updated = products.map((p) =>
      p.id === product.id && p.source === product.source
        ? { ...p, sku: newSku }
        : p,
    );
    setProducts(updated);

    // Persist back to localStorage
    if (product.source === "inventory") {
      try {
        const inv = JSON.parse(localStorage.getItem("erpInventory") || "[]");
        const newInv = inv.map((item: Record<string, unknown>) =>
          (item.id || item.name) === product.id
            ? { ...item, sku: newSku }
            : item,
        );
        localStorage.setItem("erpInventory", JSON.stringify(newInv));
      } catch {}
    } else {
      try {
        const cat = JSON.parse(
          localStorage.getItem("erpProductCatalog") || "[]",
        );
        const newCat = cat.map((item: Record<string, unknown>) =>
          (item.id || item.name) === product.id
            ? { ...item, sku: newSku }
            : item,
        );
        localStorage.setItem("erpProductCatalog", JSON.stringify(newCat));
      } catch {}
    }

    setEditingId(null);
  }

  function handleSearch() {
    const q = searchQuery.trim().toUpperCase();
    const found = products.find((p) => (p.sku || "").toUpperCase() === q);
    setSearchResult(found || null);
    setSearched(true);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Barcode className="w-7 h-7 text-orange-400" />
        <h2 className="text-2xl font-bold text-white">
          {t("modules.Barcode")}
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2" data-ocid="barcode.tab">
        <Button
          variant={activeTab === "sku" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("sku")}
          data-ocid="barcode.sku_tab"
        >
          {t("barcode.skuManagement")}
        </Button>
        <Button
          variant={activeTab === "search" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("search")}
          data-ocid="barcode.search_tab"
        >
          {t("barcode.barcodeSearch")}
        </Button>
      </div>

      {activeTab === "sku" && (
        <div className="space-y-4">
          {products.length === 0 ? (
            <div
              className="text-slate-400 text-center py-12"
              data-ocid="barcode.empty_state"
            >
              {t("barcode.noProduct")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-ocid="barcode.table">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="text-left py-2 px-3">{t("barcode.sku")}</th>
                    <th className="text-left py-2 px-3">Barkod</th>
                    <th className="text-left py-2 px-3">Ad</th>
                    <th className="text-left py-2 px-3">Kategori</th>
                    <th className="text-left py-2 px-3">Fiyat</th>
                    <th className="text-left py-2 px-3">
                      {t("barcode.source")}
                    </th>
                    <th className="py-2 px-3" />
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, idx) => (
                    <tr
                      key={`${product.source}-${product.id}`}
                      className="border-b border-slate-800 hover:bg-slate-800/40"
                      data-ocid={`barcode.item.${idx + 1}`}
                    >
                      <td className="py-3 px-3">
                        {editingId === `${product.source}-${product.id}` ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-7 w-32 text-xs"
                              data-ocid="barcode.sku_input"
                            />
                            <Button
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => saveSKU(product, editValue)}
                              data-ocid="barcode.save_button"
                            >
                              ✓
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              onClick={() => setEditingId(null)}
                              data-ocid="barcode.cancel_button"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="font-mono text-orange-300">
                            {product.sku}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="bg-slate-900 px-1 py-0.5 rounded inline-block">
                          <BarcodeVisual sku={product.sku || ""} />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-white">{product.name}</td>
                      <td className="py-3 px-3 text-slate-400">
                        {product.category || product.type || "-"}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {product.price ? `₺${product.price}` : "-"}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant="outline"
                          className={
                            product.source === "inventory"
                              ? "text-blue-400 border-blue-400/30"
                              : "text-green-400 border-green-400/30"
                          }
                        >
                          {product.source === "inventory"
                            ? t("barcode.inventory")
                            : t("barcode.catalog")}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setEditingId(`${product.source}-${product.id}`);
                            setEditValue(product.sku || "");
                          }}
                          data-ocid={`barcode.edit_button.${idx + 1}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "search" && (
        <div className="space-y-4 max-w-lg">
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearched(false);
              }}
              placeholder={t("barcode.searchPlaceholder")}
              className="font-mono"
              data-ocid="barcode.search_input"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} data-ocid="barcode.primary_button">
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {searched && searchResult && (
            <div
              className="bg-slate-800 rounded-lg p-4 space-y-3"
              data-ocid="barcode.success_state"
            >
              <p className="text-green-400 font-semibold">
                {t("barcode.productFound")}
              </p>
              <div className="bg-slate-900 p-3 rounded inline-block">
                <BarcodeVisual sku={searchResult.sku || ""} />
                <p className="text-orange-300 font-mono text-sm mt-1">
                  {searchResult.sku}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-slate-400">Ad: </span>
                  <span className="text-white">{searchResult.name}</span>
                </div>
                <div>
                  <span className="text-slate-400">
                    {t("barcode.source")}:{" "}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      searchResult.source === "inventory"
                        ? "text-blue-400 border-blue-400/30"
                        : "text-green-400 border-green-400/30"
                    }
                  >
                    {searchResult.source === "inventory"
                      ? t("barcode.inventory")
                      : t("barcode.catalog")}
                  </Badge>
                </div>
                {searchResult.price ? (
                  <div>
                    <span className="text-slate-400">Fiyat: </span>
                    <span className="text-white">₺{searchResult.price}</span>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {searched && !searchResult && (
            <div
              className="text-slate-400 py-6 text-center"
              data-ocid="barcode.error_state"
            >
              {t("barcode.noProduct")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
