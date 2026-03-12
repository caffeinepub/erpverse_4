import type React from "react";
import { createContext, useContext, useState } from "react";

export interface UserProfile {
  id: string;
  displayName: string;
  loginCode: string;
  personnelCode: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  sector: string;
  address: string;
  contactEmail: string;
  phone: string;
  foundedYear: string;
  ownerId: string;
  createdAt: string;
}

export interface CompanyMembership {
  companyId: string;
  userId: string;
  roles: Array<{
    CompanyOwner?: null;
    CompanyManager?: null;
    CompanyAdmin?: null;
    CompanyEmployee?: null;
  }>;
  grantedModules: string[];
  addedAt: string;
}

export type PortalType = "owner" | "manager" | "admin" | "employee";

interface AuthContextType {
  user: UserProfile | null;
  setUser: (u: UserProfile | null) => void;
  company: Company | null;
  setCompany: (c: Company | null) => void;
  membership: CompanyMembership | null;
  setMembership: (m: CompanyMembership | null) => void;
  portalType: PortalType;
  setPortalType: (p: PortalType) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  company: null,
  setCompany: () => {},
  membership: null,
  setMembership: () => {},
  portalType: "employee",
  setPortalType: () => {},
  logout: () => {},
});

function loadFromStorage<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(() =>
    loadFromStorage("erpverse_user"),
  );
  const [company, setCompanyState] = useState<Company | null>(() =>
    loadFromStorage("erpverse_company"),
  );
  const [membership, setMembershipState] = useState<CompanyMembership | null>(
    () => loadFromStorage("erpverse_membership"),
  );
  const [portalType, setPortalType] = useState<PortalType>("employee");

  const setUser = (u: UserProfile | null) => {
    setUserState(u);
    if (u) localStorage.setItem("erpverse_user", JSON.stringify(u));
    else localStorage.removeItem("erpverse_user");
  };

  const setCompany = (c: Company | null) => {
    setCompanyState(c);
    if (c) localStorage.setItem("erpverse_company", JSON.stringify(c));
    else localStorage.removeItem("erpverse_company");
  };

  const setMembership = (m: CompanyMembership | null) => {
    setMembershipState(m);
    if (m) localStorage.setItem("erpverse_membership", JSON.stringify(m));
    else localStorage.removeItem("erpverse_membership");
  };

  const logout = () => {
    setUser(null);
    setCompany(null);
    setMembership(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        company,
        setCompany,
        membership,
        setMembership,
        portalType,
        setPortalType,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function getRoleName(role: CompanyMembership["roles"][0]): string {
  if ("CompanyOwner" in role) return "role.owner";
  if ("CompanyManager" in role) return "role.manager";
  if ("CompanyAdmin" in role) return "role.admin";
  return "role.employee";
}

export function isOwner(membership: CompanyMembership | null): boolean {
  if (!membership) return false;
  return membership.roles.some((r) => "CompanyOwner" in r);
}

export function isManager(membership: CompanyMembership | null): boolean {
  if (!membership) return false;
  return membership.roles.some(
    (r) => "CompanyOwner" in r || "CompanyManager" in r,
  );
}
