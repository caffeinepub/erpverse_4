import {
  Building2,
  MapPin,
  Plus,
  Receipt,
  Search,
  Star,
  StarOff,
  Trash2,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useLanguage } from "../contexts/LanguageContext";

type AddressType = "delivery" | "invoice" | "general";

interface CustomerAddress {
  id: string;
  customerId: string;
  customerName: string;
  type: AddressType;
  label: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  contactName: string;
  contactPhone: string;
  isDefault: boolean;
  createdAt: string;
}

function getCompanyId() {
  try {
    const s = localStorage.getItem("erpverse_session");
    if (s) return JSON.parse(s).companyId || "default";
  } catch {}
  return "default";
}

const STORAGE_KEY = () => `erp_customer_addresses_${getCompanyId()}`;
const CUSTOMERS_KEY = () => `erp_crm_customers_${getCompanyId()}`;

function loadAddresses(): CustomerAddress[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY()) || "[]");
  } catch {
    return [];
  }
}

function saveAddresses(data: CustomerAddress[]) {
  localStorage.setItem(STORAGE_KEY(), JSON.stringify(data));
}

function loadCRMCustomers(): { id: string; name: string }[] {
  try {
    const raw = localStorage.getItem(CUSTOMERS_KEY());
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export default function CustomerAddressModule() {
  const { t } = useLanguage();
  const [addresses, setAddresses] = useState<CustomerAddress[]>(loadAddresses);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | AddressType>("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [crmCustomers, setCrmCustomers] = useState<
    { id: string; name: string }[]
  >([]);

  const [form, setForm] = useState({
    customerId: "",
    customerName: "",
    type: "delivery" as AddressType,
    label: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    district: "",
    postalCode: "",
    country: "Türkiye",
    contactName: "",
    contactPhone: "",
    isDefault: false,
  });

  useEffect(() => {
    setCrmCustomers(loadCRMCustomers());
  }, []);

  useEffect(() => {
    saveAddresses(addresses);
  }, [addresses]);

  const resetForm = () => {
    setForm({
      customerId: "",
      customerName: "",
      type: "delivery",
      label: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      district: "",
      postalCode: "",
      country: "Türkiye",
      contactName: "",
      contactPhone: "",
      isDefault: false,
    });
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (addr: CustomerAddress) => {
    setForm({
      customerId: addr.customerId,
      customerName: addr.customerName,
      type: addr.type,
      label: addr.label,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2,
      city: addr.city,
      district: addr.district,
      postalCode: addr.postalCode,
      country: addr.country,
      contactName: addr.contactName,
      contactPhone: addr.contactPhone,
      isDefault: addr.isDefault,
    });
    setEditId(addr.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (
      !form.customerName.trim() ||
      !form.addressLine1.trim() ||
      !form.city.trim()
    )
      return;

    let updated = [...addresses];

    if (editId) {
      updated = updated.map((a) => (a.id === editId ? { ...a, ...form } : a));
    } else {
      const newAddr: CustomerAddress = {
        id: Date.now().toString(),
        ...form,
        createdAt: new Date().toISOString(),
      };
      // If isDefault, remove default from others of same customer+type
      if (form.isDefault) {
        updated = updated.map((a) =>
          a.customerId === form.customerId && a.type === form.type
            ? { ...a, isDefault: false }
            : a,
        );
      }
      updated.push(newAddr);
    }

    setAddresses(updated);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSetDefault = (addr: CustomerAddress) => {
    setAddresses((prev) =>
      prev.map((a) => {
        if (a.customerId === addr.customerId && a.type === addr.type) {
          return { ...a, isDefault: a.id === addr.id };
        }
        return a;
      }),
    );
  };

  const filtered = addresses.filter((a) => {
    const matchSearch =
      a.customerName.toLowerCase().includes(search.toLowerCase()) ||
      a.city.toLowerCase().includes(search.toLowerCase()) ||
      a.label.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || a.type === filterType;
    return matchSearch && matchType;
  });

  // Group by customer
  const grouped: Record<string, CustomerAddress[]> = {};
  for (const a of filtered) {
    if (!grouped[a.customerName]) grouped[a.customerName] = [];
    grouped[a.customerName].push(a);
  }

  const typeIcon = (type: AddressType) => {
    if (type === "delivery") return <Truck className="w-4 h-4" />;
    if (type === "invoice") return <Receipt className="w-4 h-4" />;
    return <Building2 className="w-4 h-4" />;
  };

  const typeBadgeColor = (type: AddressType) => {
    if (type === "delivery")
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    if (type === "invoice")
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    return "bg-slate-500/20 text-slate-300 border-slate-500/30";
  };

  const typeLabel = (type: AddressType) => {
    if (type === "delivery") return t("addr.type.delivery");
    if (type === "invoice") return t("addr.type.invoice");
    return t("addr.type.general");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{t("addr.title")}</h1>
          <p className="text-sm text-slate-400">{t("addr.subtitle")}</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          data-ocid="addr.new"
        >
          <Plus className="w-4 h-4" />
          {t("addr.newAddress")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {(["all", "delivery", "invoice", "general"] as const).map((type) => {
          const count =
            type === "all"
              ? addresses.length
              : addresses.filter((a) => a.type === type).length;
          const colors = [
            "from-blue-600 to-blue-700",
            "from-cyan-600 to-cyan-700",
            "from-emerald-600 to-emerald-700",
            "from-slate-600 to-slate-700",
          ];
          const idx = ["all", "delivery", "invoice", "general"].indexOf(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`p-4 rounded-xl bg-gradient-to-br ${colors[idx]} text-white text-left transition-opacity ${
                filterType === type
                  ? "ring-2 ring-white/40"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm opacity-80">
                {type === "all"
                  ? t("addr.all")
                  : typeLabel(type as AddressType)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("addr.search")}
          className="pl-9 bg-slate-800 border-slate-700 text-white"
        />
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">
            {editId ? t("addr.editAddress") : t("addr.newAddress")}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Customer */}
            <div className="space-y-1">
              <Label className="text-slate-300">{t("addr.customer")} *</Label>
              {crmCustomers.length > 0 ? (
                <select
                  value={form.customerId}
                  onChange={(e) => {
                    const c = crmCustomers.find((x) => x.id === e.target.value);
                    setForm((f) => ({
                      ...f,
                      customerId: e.target.value,
                      customerName: c?.name || "",
                    }));
                  }}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                >
                  <option value="">{t("addr.selectCustomer")}</option>
                  {crmCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={form.customerName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customerName: e.target.value }))
                  }
                  placeholder={t("addr.customerName")}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              )}
            </div>

            {/* Type */}
            <div className="space-y-1">
              <Label className="text-slate-300">{t("addr.type")} *</Label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as AddressType,
                  }))
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
              >
                <option value="delivery">{t("addr.type.delivery")}</option>
                <option value="invoice">{t("addr.type.invoice")}</option>
                <option value="general">{t("addr.type.general")}</option>
              </select>
            </div>

            {/* Label */}
            <div className="space-y-1">
              <Label className="text-slate-300">{t("addr.label")}</Label>
              <Input
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, label: e.target.value }))
                }
                placeholder={t("addr.labelPlaceholder")}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* Country */}
            <div className="space-y-1">
              <Label className="text-slate-300">{t("addr.country")}</Label>
              <Input
                value={form.country}
                onChange={(e) =>
                  setForm((f) => ({ ...f, country: e.target.value }))
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* Address Line 1 */}
            <div className="space-y-1 col-span-2">
              <Label className="text-slate-300">{t("addr.line1")} *</Label>
              <Input
                value={form.addressLine1}
                onChange={(e) =>
                  setForm((f) => ({ ...f, addressLine1: e.target.value }))
                }
                placeholder={t("addr.line1Placeholder")}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* Address Line 2 */}
            <div className="space-y-1 col-span-2">
              <Label className="text-slate-300">{t("addr.line2")}</Label>
              <Input
                value={form.addressLine2}
                onChange={(e) =>
                  setForm((f) => ({ ...f, addressLine2: e.target.value }))
                }
                placeholder={t("addr.line2Placeholder")}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* District */}
            <div className="space-y-1">
              <Label className="text-slate-300">{t("addr.district")}</Label>
              <Input
                value={form.district}
                onChange={(e) =>
                  setForm((f) => ({ ...f, district: e.target.value }))
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* City */}
            <div className="space-y-1">
              <Label className="text-slate-300">{t("addr.city")} *</Label>
              <Input
                value={form.city}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value }))
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* Postal Code */}
            <div className="space-y-1">
              <Label className="text-slate-300">{t("addr.postalCode")}</Label>
              <Input
                value={form.postalCode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, postalCode: e.target.value }))
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* Contact Name */}
            <div className="space-y-1">
              <Label className="text-slate-300">{t("addr.contactName")}</Label>
              <Input
                value={form.contactName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contactName: e.target.value }))
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* Contact Phone */}
            <div className="space-y-1">
              <Label className="text-slate-300">{t("addr.contactPhone")}</Label>
              <Input
                value={form.contactPhone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contactPhone: e.target.value }))
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          {/* Default checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) =>
                setForm((f) => ({ ...f, isDefault: e.target.checked }))
              }
              className="w-4 h-4 rounded accent-blue-500"
            />
            <span className="text-slate-300 text-sm">
              {t("addr.setDefault")}
            </span>
          </label>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editId ? t("addr.update") : t("addr.save")}
            </Button>
            <Button
              variant="outline"
              onClick={resetForm}
              className="border-slate-600 text-slate-300"
            >
              {t("addr.cancel")}
            </Button>
          </div>
        </div>
      )}

      {/* Address List grouped by customer */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("addr.empty")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([customerName, addrs]) => (
            <div
              key={customerName}
              className="bg-slate-800/50 rounded-xl border border-slate-700"
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
                <Building2 className="w-4 h-4 text-blue-400" />
                <h3 className="text-white font-semibold">{customerName}</h3>
                <span className="ml-auto text-xs text-slate-400">
                  {addrs.length} {t("addr.addresses")}
                </span>
              </div>
              <div className="divide-y divide-slate-700/50">
                {addrs.map((addr) => (
                  <div key={addr.id} className="p-4 flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg border ${typeBadgeColor(addr.type)}`}
                    >
                      {typeIcon(addr.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium text-sm">
                          {addr.label || typeLabel(addr.type)}
                        </span>
                        <Badge
                          className={`text-xs border ${typeBadgeColor(addr.type)}`}
                        >
                          {typeLabel(addr.type)}
                        </Badge>
                        {addr.isDefault && (
                          <Badge className="text-xs bg-amber-500/20 text-amber-300 border-amber-500/30">
                            <Star className="w-3 h-3 mr-1" />
                            {t("addr.default")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-300 text-sm mt-1">
                        {addr.addressLine1}
                        {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {[
                          addr.district,
                          addr.city,
                          addr.postalCode,
                          addr.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      {addr.contactName && (
                        <p className="text-slate-500 text-xs mt-0.5">
                          {addr.contactName}
                          {addr.contactPhone ? ` · ${addr.contactPhone}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr)}
                        title={t("addr.setDefault")}
                        className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors"
                      >
                        {addr.isDefault ? (
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ) : (
                          <StarOff className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(addr)}
                        className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-colors text-xs px-2"
                      >
                        {t("addr.edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(addr.id)}
                        className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
