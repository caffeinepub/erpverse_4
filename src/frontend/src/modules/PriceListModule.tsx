import { Percent, Plus, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

interface PriceList {
  id: string;
  name: string;
  currency: string;
  description: string;
  createdAt: string;
}

interface DiscountRule {
  id: string;
  name: string;
  customerGroup: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  currency: string;
  createdAt: string;
}

function getPriceLists(companyId: string): PriceList[] {
  try {
    const stored = localStorage.getItem(`erpverse_pricelists_${companyId}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function savePriceLists(companyId: string, lists: PriceList[]) {
  localStorage.setItem(
    `erpverse_pricelists_${companyId}`,
    JSON.stringify(lists),
  );
}

function getDiscountRules(companyId: string): DiscountRule[] {
  try {
    const stored = localStorage.getItem(`erpverse_discountrules_${companyId}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveDiscountRules(companyId: string, rules: DiscountRule[]) {
  localStorage.setItem(
    `erpverse_discountrules_${companyId}`,
    JSON.stringify(rules),
  );
}

export default function PriceListModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const companyId = company?.id ?? "default";

  const [activeTab, setActiveTab] = useState<"pricelists" | "discounts">(
    "pricelists",
  );

  // Price Lists state
  const [priceLists, setPriceLists] = useState<PriceList[]>(() =>
    getPriceLists(companyId),
  );
  const [showPLForm, setShowPLForm] = useState(false);
  const [plName, setPlName] = useState("");
  const [plCurrency, setPlCurrency] = useState("TRY");
  const [plDescription, setPlDescription] = useState("");

  // Discount Rules state
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>(() =>
    getDiscountRules(companyId),
  );
  const [showDRForm, setShowDRForm] = useState(false);
  const [drName, setDrName] = useState("");
  const [drCustomerGroup, setDrCustomerGroup] = useState("");
  const [drType, setDrType] = useState<"percentage" | "fixed">("percentage");
  const [drValue, setDrValue] = useState("");
  const [drCurrency, setDrCurrency] = useState("TRY");

  const handleAddPriceList = () => {
    if (!plName.trim()) return;
    const newList: PriceList = {
      id: Date.now().toString(),
      name: plName.trim(),
      currency: plCurrency,
      description: plDescription.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...priceLists, newList];
    setPriceLists(updated);
    savePriceLists(companyId, updated);
    setPlName("");
    setPlCurrency("TRY");
    setPlDescription("");
    setShowPLForm(false);
  };

  const handleDeletePriceList = (id: string) => {
    const updated = priceLists.filter((p) => p.id !== id);
    setPriceLists(updated);
    savePriceLists(companyId, updated);
  };

  const handleAddDiscountRule = () => {
    if (!drName.trim() || !drValue) return;
    const newRule: DiscountRule = {
      id: Date.now().toString(),
      name: drName.trim(),
      customerGroup: drCustomerGroup.trim(),
      discountType: drType,
      discountValue: Number(drValue),
      currency: drCurrency,
      createdAt: new Date().toISOString(),
    };
    const updated = [...discountRules, newRule];
    setDiscountRules(updated);
    saveDiscountRules(companyId, updated);
    setDrName("");
    setDrCustomerGroup("");
    setDrType("percentage");
    setDrValue("");
    setDrCurrency("TRY");
    setShowDRForm(false);
  };

  const handleDeleteDiscountRule = (id: string) => {
    const updated = discountRules.filter((r) => r.id !== id);
    setDiscountRules(updated);
    saveDiscountRules(companyId, updated);
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Tag className="w-7 h-7 text-pink-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">
            {t("modules.PriceLists")}
          </h2>
          <p className="text-slate-400 text-sm">{t("priceList.subtitle")}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("pricelists")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "pricelists"
              ? "text-pink-400 border-pink-400"
              : "text-slate-400 border-transparent hover:text-white"
          }`}
          data-ocid="priceList.pricelists_tab"
        >
          {t("priceList.priceLists")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("discounts")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "discounts"
              ? "text-pink-400 border-pink-400"
              : "text-slate-400 border-transparent hover:text-white"
          }`}
          data-ocid="priceList.discounts_tab"
        >
          {t("priceList.discountRules")}
        </button>
      </div>

      {/* Price Lists Tab */}
      {activeTab === "pricelists" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-slate-400 text-sm">
              {priceLists.length} {t("priceList.listCount")}
            </p>
            <Button
              className="bg-pink-600 hover:bg-pink-700 text-white"
              onClick={() => setShowPLForm(!showPLForm)}
              data-ocid="priceList.add_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("priceList.addList")}
            </Button>
          </div>

          {showPLForm && (
            <div className="bg-slate-800 rounded-xl p-5 border border-white/10 mb-5 space-y-4">
              <h3 className="text-white font-semibold">
                {t("priceList.newList")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300 text-sm mb-1 block">
                    {t("priceList.listName")}
                  </Label>
                  <Input
                    value={plName}
                    onChange={(e) => setPlName(e.target.value)}
                    placeholder={t("priceList.listNamePlaceholder")}
                    className="bg-white/10 border-white/20 text-white"
                    data-ocid="priceList.name_input"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1 block">
                    {t("priceList.currency")}
                  </Label>
                  <Select value={plCurrency} onValueChange={setPlCurrency}>
                    <SelectTrigger
                      className="bg-white/10 border-white/20 text-white"
                      data-ocid="priceList.currency_select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10 text-white">
                      <SelectItem value="TRY">TRY - Türk Lirası</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1 block">
                  {t("priceList.description")}
                </Label>
                <Input
                  value={plDescription}
                  onChange={(e) => setPlDescription(e.target.value)}
                  placeholder={t("priceList.descriptionPlaceholder")}
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="priceList.description_input"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                  onClick={handleAddPriceList}
                  disabled={!plName.trim()}
                  data-ocid="priceList.submit_button"
                >
                  {t("common.save")}
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 text-slate-300"
                  onClick={() => setShowPLForm(false)}
                  data-ocid="priceList.cancel_button"
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          )}

          {priceLists.length === 0 ? (
            <div
              className="text-center py-16 text-slate-500"
              data-ocid="priceList.empty_state"
            >
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>{t("priceList.noPriceLists")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {priceLists.map((pl, i) => (
                <div
                  key={pl.id}
                  className="bg-slate-800 rounded-xl p-5 border border-white/10"
                  data-ocid={`priceList.item.${i + 1}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-semibold">{pl.name}</p>
                      {pl.description && (
                        <p className="text-slate-400 text-xs mt-1">
                          {pl.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePriceList(pl.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                      data-ocid={`priceList.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <Badge className="bg-pink-500/20 text-pink-300 border-0">
                    {pl.currency}
                  </Badge>
                  <p className="text-slate-500 text-xs mt-2">
                    {new Date(pl.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Discount Rules Tab */}
      {activeTab === "discounts" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-slate-400 text-sm">
              {discountRules.length} {t("priceList.ruleCount")}
            </p>
            <Button
              className="bg-pink-600 hover:bg-pink-700 text-white"
              onClick={() => setShowDRForm(!showDRForm)}
              data-ocid="priceList.add_discount_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("priceList.addRule")}
            </Button>
          </div>

          {showDRForm && (
            <div className="bg-slate-800 rounded-xl p-5 border border-white/10 mb-5 space-y-4">
              <h3 className="text-white font-semibold">
                {t("priceList.newRule")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300 text-sm mb-1 block">
                    {t("priceList.ruleName")}
                  </Label>
                  <Input
                    value={drName}
                    onChange={(e) => setDrName(e.target.value)}
                    placeholder={t("priceList.ruleNamePlaceholder")}
                    className="bg-white/10 border-white/20 text-white"
                    data-ocid="priceList.rule_name_input"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1 block">
                    {t("priceList.customerGroup")}
                  </Label>
                  <Input
                    value={drCustomerGroup}
                    onChange={(e) => setDrCustomerGroup(e.target.value)}
                    placeholder={t("priceList.customerGroupPlaceholder")}
                    className="bg-white/10 border-white/20 text-white"
                    data-ocid="priceList.customer_group_input"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1 block">
                    {t("priceList.discountType")}
                  </Label>
                  <Select
                    value={drType}
                    onValueChange={(v) =>
                      setDrType(v as "percentage" | "fixed")
                    }
                  >
                    <SelectTrigger
                      className="bg-white/10 border-white/20 text-white"
                      data-ocid="priceList.discount_type_select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10 text-white">
                      <SelectItem value="percentage">
                        {t("priceList.percentage")}
                      </SelectItem>
                      <SelectItem value="fixed">
                        {t("priceList.fixedAmount")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300 text-sm mb-1 block">
                    {drType === "percentage"
                      ? t("priceList.discountPercent")
                      : t("priceList.discountAmount")}
                  </Label>
                  <Input
                    type="number"
                    value={drValue}
                    onChange={(e) => setDrValue(e.target.value)}
                    placeholder={drType === "percentage" ? "10" : "50"}
                    className="bg-white/10 border-white/20 text-white"
                    data-ocid="priceList.discount_value_input"
                  />
                </div>
                {drType === "fixed" && (
                  <div>
                    <Label className="text-slate-300 text-sm mb-1 block">
                      {t("priceList.currency")}
                    </Label>
                    <Select value={drCurrency} onValueChange={setDrCurrency}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/10 text-white">
                        <SelectItem value="TRY">TRY</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                  onClick={handleAddDiscountRule}
                  disabled={!drName.trim() || !drValue}
                  data-ocid="priceList.rule_submit_button"
                >
                  {t("common.save")}
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 text-slate-300"
                  onClick={() => setShowDRForm(false)}
                  data-ocid="priceList.rule_cancel_button"
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          )}

          {discountRules.length === 0 ? (
            <div
              className="text-center py-16 text-slate-500"
              data-ocid="priceList.discounts_empty_state"
            >
              <Percent className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>{t("priceList.noDiscountRules")}</p>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full" data-ocid="priceList.table">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                      {t("priceList.ruleName")}
                    </th>
                    <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                      {t("priceList.customerGroup")}
                    </th>
                    <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                      {t("priceList.discountType")}
                    </th>
                    <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                      {t("priceList.value")}
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {discountRules.map((rule, i) => (
                    <tr
                      key={rule.id}
                      className="border-b border-white/10 last:border-0"
                      data-ocid={`priceList.rule.item.${i + 1}`}
                    >
                      <td className="px-5 py-3 text-white font-medium">
                        {rule.name}
                      </td>
                      <td className="px-5 py-3 text-slate-300">
                        {rule.customerGroup || "-"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          className={
                            rule.discountType === "percentage"
                              ? "bg-blue-500/20 text-blue-300 border-0"
                              : "bg-amber-500/20 text-amber-300 border-0"
                          }
                        >
                          {rule.discountType === "percentage"
                            ? t("priceList.percentage")
                            : t("priceList.fixedAmount")}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-white">
                        {rule.discountType === "percentage"
                          ? `%${rule.discountValue}`
                          : `${rule.discountValue} ${rule.currency}`}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteDiscountRule(rule.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                          data-ocid={`priceList.rule_delete_button.${i + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
