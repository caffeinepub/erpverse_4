export interface UserProfile {
  id: string;
  displayName: string;
  loginCode: string;
  personnelCode: string;
  createdAt: bigint;
}

export type CompanyRole = 
  | { CompanyOwner: null }
  | { CompanyManager: null }
  | { CompanyAdmin: null }
  | { CompanyEmployee: null };

export type ModuleName = string;

export interface CompanyMembership {
  companyId: string;
  userId: string;
  roles: CompanyRole[];
  grantedModules: ModuleName[];
  addedAt: bigint;
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
  createdAt: bigint;
}

export interface DashboardSummary {
  employeeCount: bigint;
  activeModules: bigint;
  companyName: string;
}

export interface _SERVICE {
  registerUser(displayName: string): Promise<[] | [UserProfile]>;
  loginWithCode(loginCode: string): Promise<[] | [UserProfile]>;
  getUserProfile(userId: string): Promise<[] | [UserProfile]>;
  registerCompany(
    ownerId: string,
    name: string,
    sector: string,
    address: string,
    contactEmail: string,
    phone: string,
    foundedYear: string
  ): Promise<[] | [Company]>;
  getCompany(companyId: string): Promise<[] | [Company]>;
  getCompanyMemberships(userId: string): Promise<CompanyMembership[]>;
  getUserCompanies(userId: string): Promise<Company[]>;
  addPersonnelToCompany(
    requesterId: string,
    personnelCode: string,
    companyId: string,
    roles: CompanyRole[],
    modules: ModuleName[]
  ): Promise<boolean>;
  getCompanyMembers(companyId: string): Promise<CompanyMembership[]>;
  removePersonnelFromCompany(
    requesterId: string,
    targetUserId: string,
    companyId: string
  ): Promise<boolean>;
  getGrantedModules(userId: string, companyId: string): Promise<ModuleName[]>;
  updateModulePermissions(
    requesterId: string,
    targetUserId: string,
    companyId: string,
    modules: ModuleName[]
  ): Promise<boolean>;
  getDashboardSummary(userId: string, companyId: string): Promise<[] | [DashboardSummary]>;
  getUserByPersonnelCode(code: string): Promise<[] | [UserProfile]>;
}
