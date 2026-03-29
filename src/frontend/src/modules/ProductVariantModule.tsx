import {
  ArrowLeft,
  Layers,
  Package,
  Plus,
  Search,
  Shuffle,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

const BADGE_COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
  "bg-purple-100 text-purple-800",
  "bg-orange-100 text-orange-800",
  "bg-pink-100 text-pink-800",
  "bg-teal-100 text-teal-800",
];

interface VariantGroup {
  name: string;
  options: string[];
}

interface ProductVariant {
  id: string;
  values: Record<string, string>;
  sku: string;
  price: string;
  stock: string;
  active: boolean;
}

interface ProductVariantData {
  productId: string;
  productName: string;
  groups: VariantGroup[];
  variants: ProductVariant[];
}

function generateSKU(
  productId: string,
  values: Record<string, string>,
): string {
  const base = productId.slice(0, 4).toUpperCase();
  const suffix = Object.values(values)
    .map((v) => v.slice(0, 2).toUpperCase())
    .join("-");
  return `${base}-${suffix}`;
}

function cartesian(groups: VariantGroup[]): Record<string, string>[] {
  if (groups.length === 0) return [];
  return groups.reduce<Record<string, string>[]>((acc, group) => {
    if (group.options.length === 0) return acc;
    if (acc.length === 0) {
      return group.options.map((opt) => ({ [group.name]: opt }));
    }
    return acc.flatMap((combo) =>
      group.options.map((opt) => ({ ...combo, [group.name]: opt })),
    );
  }, []);
}

export default function ProductVariantModule() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const companyId = company?.id ?? "";

  const [variantData, setVariantData] = useLocalStorage<ProductVariantData[]>(
    `productVariants_${companyId}`,
    [],
  );

  const [activeTab, setActiveTab] = useState<"products" | "all">("products");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "passive"
  >("all");

  // Group editor state
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupOptions, setNewGroupOptions] = useState("");

  const selectedData =
    variantData.find((d) => d.productId === selectedProductId) ?? null;

  // Get products from inventory localStorage
  const rawProducts: { id: string; name: string }[] = (() => {
    try {
      const inv = localStorage.getItem(`erpverse_inventory_${companyId}`);
      if (inv) {
        const parsed = JSON.parse(inv);
        return (parsed as any[]).map((p: any) => ({
          id: p.id ?? p.name,
          name: p.name,
        }));
      }
    } catch {}
    // fallback: show products already in variantData
    return variantData.map((d) => ({ id: d.productId, name: d.productName }));
  })();

  const allProducts: { id: string; name: string }[] = [
    ...rawProducts,
    ...variantData
      .filter((d) => !rawProducts.find((p) => p.id === d.productId))
      .map((d) => ({ id: d.productId, name: d.productName })),
  ];

  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  function getOrCreate(
    productId: string,
    productName: string,
  ): ProductVariantData {
    return (
      variantData.find((d) => d.productId === productId) ?? {
        productId,
        productName,
        groups: [],
        variants: [],
      }
    );
  }

  function saveData(updated: ProductVariantData) {
    setVariantData((prev) => {
      const exists = prev.find((d) => d.productId === updated.productId);
      if (exists)
        return prev.map((d) =>
          d.productId === updated.productId ? updated : d,
        );
      return [...prev, updated];
    });
  }

  function addGroup() {
    if (!selectedProductId || !newGroupName.trim() || !newGroupOptions.trim())
      return;
    const opts = newGroupOptions
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    if (opts.length === 0) return;
    const productName =
      allProducts.find((p) => p.id === selectedProductId)?.name ??
      selectedProductId;
    const data = getOrCreate(selectedProductId, productName);
    const updated: ProductVariantData = {
      ...data,
      groups: [...data.groups, { name: newGroupName.trim(), options: opts }],
    };
    saveData(updated);
    setNewGroupName("");
    setNewGroupOptions("");
    toast.success(t("variants.group_added") || "Grup eklendi");
  }

  function removeGroup(groupName: string) {
    if (!selectedProductId) return;
    const productName =
      allProducts.find((p) => p.id === selectedProductId)?.name ??
      selectedProductId;
    const data = getOrCreate(selectedProductId, productName);
    const updated: ProductVariantData = {
      ...data,
      groups: data.groups.filter((g) => g.name !== groupName),
      variants: data.variants.filter((v) => !(groupName in v.values)),
    };
    saveData(updated);
  }

  function generateCombinations() {
    if (!selectedProductId || !selectedData) return;
    const combos = cartesian(selectedData.groups);
    if (combos.length === 0) {
      toast.error(t("variants.no_groups") || "Önce grup tanımlayın");
      return;
    }
    const existing = selectedData.variants;
    const newVariants: ProductVariant[] = combos.map((combo) => {
      const key = JSON.stringify(combo);
      const found = existing.find((v) => JSON.stringify(v.values) === key);
      if (found) return found;
      return {
        id: `var_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        values: combo,
        sku: generateSKU(selectedProductId, combo),
        price: "",
        stock: "0",
        active: true,
      };
    });
    saveData({ ...selectedData, variants: newVariants });
    toast.success(
      `${newVariants.length} ${t("variants.combinations_created") || "kombinasyon oluşturuldu"}`,
    );
  }

  function updateVariant(id: string, field: keyof ProductVariant, value: any) {
    if (!selectedData) return;
    saveData({
      ...selectedData,
      variants: selectedData.variants.map((v) =>
        v.id === id ? { ...v, [field]: value } : v,
      ),
    });
  }

  function deleteVariant(id: string) {
    if (!selectedData) return;
    saveData({
      ...selectedData,
      variants: selectedData.variants.filter((v) => v.id !== id),
    });
  }

  // All variants view
  const allVariants = variantData.flatMap((d) =>
    d.variants.map((v) => ({ ...v, productName: d.productName })),
  );
  const filteredAllVariants = allVariants.filter((v) => {
    if (filterStatus === "active" && !v.active) return false;
    if (filterStatus === "passive" && v.active) return false;
    return true;
  });

  const totalVariants = selectedData?.variants.length ?? 0;
  const totalStock =
    selectedData?.variants.reduce(
      (sum, v) => sum + (Number(v.stock) || 0),
      0,
    ) ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-violet-500/20">
          <Layers className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">
            {t("productvariants.title") || "Ürün Varyant Yönetimi"}
          </h2>
          <p className="text-sm text-slate-400">
            {t("productvariants.subtitle") ||
              "Beden, renk ve diğer varyantları yönetin"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab("products");
            setSelectedProductId(null);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "products"
              ? "bg-violet-600 text-white"
              : "bg-white/5 text-slate-400 hover:text-white"
          }`}
          data-ocid="productvariants.products.tab"
        >
          {t("productvariants.products_tab") || "Ürün Listesi"}
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("all");
            setSelectedProductId(null);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "all"
              ? "bg-violet-600 text-white"
              : "bg-white/5 text-slate-400 hover:text-white"
          }`}
          data-ocid="productvariants.all.tab"
        >
          {t("productvariants.all_tab") || "Tüm Varyantlar"}
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === "products" && !selectedProductId && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              className="pl-9 bg-white/5 border-white/10 text-white"
              placeholder={t("common.search") || "Ürün ara..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-ocid="productvariants.search_input"
            />
          </div>

          {filteredProducts.length === 0 ? (
            <div
              className="text-center py-16 text-slate-400"
              data-ocid="productvariants.empty_state"
            >
              <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>
                {t("productvariants.no_products") ||
                  "Ürün bulunamadı. Önce Ürün Kataloğu'ndan ürün ekleyin."}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredProducts.map((product, idx) => {
                const data = variantData.find(
                  (d) => d.productId === product.id,
                );
                const variantCount = data?.variants.length ?? 0;
                return (
                  <Card key={product.id} className="bg-white/5 border-white/10">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-violet-500/20">
                          <Package className="w-4 h-4 text-violet-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {product.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {variantCount > 0
                              ? `${variantCount} ${t("productvariants.variant_count") || "varyant"}`
                              : t("productvariants.no_variants") ||
                                "Varyant yok"}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-violet-500/50 text-violet-400 hover:bg-violet-500/20"
                        onClick={() => setSelectedProductId(product.id)}
                        data-ocid={`productvariants.item.${idx + 1}`}
                      >
                        <Layers className="w-4 h-4 mr-1" />
                        {t("productvariants.manage") || "Varyantlar"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Variant Management for selected product */}
      {activeTab === "products" && selectedProductId && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
              onClick={() => setSelectedProductId(null)}
              data-ocid="productvariants.close_button"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t("common.back") || "Geri"}
            </Button>
            <h3 className="text-white font-semibold">
              {allProducts.find((p) => p.id === selectedProductId)?.name}
            </h3>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-violet-500/10 border-violet-500/20">
              <CardContent className="p-4">
                <p className="text-slate-400 text-xs">
                  {t("productvariants.total_variants") || "Toplam Varyant"}
                </p>
                <p className="text-2xl font-bold text-violet-400">
                  {totalVariants}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-emerald-500/10 border-emerald-500/20">
              <CardContent className="p-4">
                <p className="text-slate-400 text-xs">
                  {t("productvariants.total_stock") || "Toplam Stok"}
                </p>
                <p className="text-2xl font-bold text-emerald-400">
                  {totalStock}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Group Definitions */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">
                {t("productvariants.groups") || "Varyant Grupları"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedData?.groups.map((group, gIdx) => (
                <div
                  key={group.name}
                  className="flex items-center gap-2 flex-wrap"
                >
                  <span className="text-slate-300 text-sm font-medium min-w-16">
                    {group.name}:
                  </span>
                  {group.options.map((opt, oIdx) => (
                    <span
                      key={opt}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_COLORS[(gIdx * 3 + oIdx) % BADGE_COLORS.length]}`}
                    >
                      {opt}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => removeGroup(group.name)}
                    className="ml-auto text-red-400 hover:text-red-300"
                    data-ocid={`productvariants.delete_button.${gIdx + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="pt-2 border-t border-white/10 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <Label className="text-slate-400 text-xs">
                    {t("productvariants.group_name") || "Grup Adı (örn. Beden)"}
                  </Label>
                  <Input
                    className="bg-white/5 border-white/10 text-white mt-1"
                    placeholder="Beden"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    data-ocid="productvariants.group_name.input"
                  />
                </div>
                <div>
                  <Label className="text-slate-400 text-xs">
                    {t("productvariants.group_options") ||
                      "Seçenekler (virgülle)"}
                  </Label>
                  <Input
                    className="bg-white/5 border-white/10 text-white mt-1"
                    placeholder="S,M,L,XL"
                    value={newGroupOptions}
                    onChange={(e) => setNewGroupOptions(e.target.value)}
                    data-ocid="productvariants.group_options.input"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    size="sm"
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={addGroup}
                    data-ocid="productvariants.add_group.button"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {t("productvariants.add_group") || "Grup Ekle"}
                  </Button>
                </div>
              </div>

              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={generateCombinations}
                data-ocid="productvariants.generate.button"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                {t("productvariants.generate") || "Kombinasyon Oluştur"}
              </Button>
            </CardContent>
          </Card>

          {/* Variant Table */}
          {selectedData && selectedData.variants.length > 0 && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">
                  {t("productvariants.variant_table") || "Varyant Tablosu"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-slate-400">
                          {t("productvariants.values") || "Değerler"}
                        </TableHead>
                        <TableHead className="text-slate-400">SKU</TableHead>
                        <TableHead className="text-slate-400">
                          {t("productvariants.price") || "Fiyat"}
                        </TableHead>
                        <TableHead className="text-slate-400">
                          {t("productvariants.stock") || "Stok"}
                        </TableHead>
                        <TableHead className="text-slate-400">
                          {t("common.status") || "Durum"}
                        </TableHead>
                        <TableHead className="text-slate-400" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedData.variants.map((variant, vIdx) => (
                        <TableRow
                          key={variant.id}
                          className="border-white/10"
                          data-ocid={`productvariants.row.${vIdx + 1}`}
                        >
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(variant.values).map(
                                ([grp, val], i) => (
                                  <span
                                    key={grp}
                                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${BADGE_COLORS[i % BADGE_COLORS.length]}`}
                                  >
                                    {val}
                                  </span>
                                ),
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300 text-xs font-mono">
                            {variant.sku}
                          </TableCell>
                          <TableCell>
                            <Input
                              className="bg-white/5 border-white/10 text-white w-24 h-7 text-xs"
                              placeholder="0.00"
                              value={variant.price}
                              onChange={(e) =>
                                updateVariant(
                                  variant.id,
                                  "price",
                                  e.target.value,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              className="bg-white/5 border-white/10 text-white w-20 h-7 text-xs"
                              placeholder="0"
                              value={variant.stock}
                              onChange={(e) =>
                                updateVariant(
                                  variant.id,
                                  "stock",
                                  e.target.value,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={variant.active}
                              onCheckedChange={(v) =>
                                updateVariant(variant.id, "active", v)
                              }
                              data-ocid={`productvariants.switch.${vIdx + 1}`}
                            />
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              className="text-red-400 hover:text-red-300"
                              onClick={() => deleteVariant(variant.id)}
                              data-ocid={`productvariants.delete_button.${vIdx + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* All Variants Tab */}
      {activeTab === "all" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["all", "active", "passive"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === s
                    ? "bg-violet-600 text-white"
                    : "bg-white/5 text-slate-400 hover:text-white"
                }`}
                data-ocid={`productvariants.filter.${s}.tab`}
              >
                {s === "all"
                  ? t("common.all") || "Tümü"
                  : s === "active"
                    ? t("common.active") || "Aktif"
                    : t("common.passive") || "Pasif"}
              </button>
            ))}
          </div>

          {filteredAllVariants.length === 0 ? (
            <div
              className="text-center py-16 text-slate-400"
              data-ocid="productvariants.all.empty_state"
            >
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>
                {t("productvariants.no_all_variants") || "Henüz varyant yok"}
              </p>
            </div>
          ) : (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-slate-400">
                          {t("common.product") || "Ürün"}
                        </TableHead>
                        <TableHead className="text-slate-400">
                          {t("productvariants.values") || "Değerler"}
                        </TableHead>
                        <TableHead className="text-slate-400">SKU</TableHead>
                        <TableHead className="text-slate-400">
                          {t("productvariants.price") || "Fiyat"}
                        </TableHead>
                        <TableHead className="text-slate-400">
                          {t("productvariants.stock") || "Stok"}
                        </TableHead>
                        <TableHead className="text-slate-400">
                          {t("common.status") || "Durum"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAllVariants.map((variant, idx) => (
                        <TableRow
                          key={variant.id}
                          className="border-white/10"
                          data-ocid={`productvariants.all.row.${idx + 1}`}
                        >
                          <TableCell className="text-slate-300 text-sm">
                            {variant.productName}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(variant.values).map(
                                ([grpKey, val], i) => (
                                  <span
                                    key={grpKey}
                                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${BADGE_COLORS[i % BADGE_COLORS.length]}`}
                                  >
                                    {val}
                                  </span>
                                ),
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300 text-xs font-mono">
                            {variant.sku}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm">
                            {variant.price ? `₺${variant.price}` : "-"}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm">
                            {variant.stock}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                variant.active
                                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                                  : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                              }
                            >
                              {variant.active
                                ? t("common.active") || "Aktif"
                                : t("common.passive") || "Pasif"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
