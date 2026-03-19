import { Actor, type ActorSubclass } from "@dfinity/agent";
import { idlFactory } from "./backend.idl";

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

export type EmployeeStatus =
  | { active: null }
  | { onLeave: null }
  | { terminated: null };

export interface BackendEmployee {
  id: string;
  companyId: string;
  name: string;
  position: string;
  department: string;
  status: EmployeeStatus;
  email: string;
  salary: bigint;
  createdAt: bigint;
}

export type CustomerStatus =
  | { lead: null }
  | { active: null }
  | { closed: null };

export interface BackendCustomer {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: CustomerStatus;
  createdAt: bigint;
}

export type PipelineStage =
  | { new_: null }
  | { contact: null }
  | { proposal: null }
  | { negotiation: null }
  | { won: null }
  | { lost: null };

export interface BackendOpportunity {
  id: string;
  companyId: string;
  name: string;
  company: string;
  value: bigint;
  assignee: string;
  stage: PipelineStage;
  createdAt: string;
}

export interface backendInterface {
  _initializeAccessControlWithSecret(userSecret: string): Promise<void>;
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
  getDashboardSummary(
    userId: string,
    companyId: string
  ): Promise<[] | [DashboardSummary]>;
  getUserByPersonnelCode(code: string): Promise<[] | [UserProfile]>;
  // HR Employee API
  addEmployee(
    companyId: string,
    requesterId: string,
    name: string,
    position: string,
    department: string,
    email: string,
    salary: bigint
  ): Promise<[] | [BackendEmployee]>;
  updateEmployee(
    companyId: string,
    requesterId: string,
    employeeId: string,
    name: string,
    position: string,
    department: string,
    status: EmployeeStatus,
    email: string,
    salary: bigint
  ): Promise<boolean>;
  removeEmployee(
    companyId: string,
    requesterId: string,
    employeeId: string
  ): Promise<boolean>;
  getEmployees(companyId: string): Promise<BackendEmployee[]>;
  // CRM Customer API
  addCustomer(
    companyId: string,
    requesterId: string,
    name: string,
    email: string,
    phone: string,
    company: string,
    status: CustomerStatus
  ): Promise<[] | [BackendCustomer]>;
  updateCustomerStatus(
    companyId: string,
    requesterId: string,
    customerId: string,
    status: CustomerStatus
  ): Promise<boolean>;
  removeCustomer(
    companyId: string,
    requesterId: string,
    customerId: string
  ): Promise<boolean>;
  getCustomers(companyId: string): Promise<BackendCustomer[]>;
  // CRM Opportunity API
  addOpportunity(
    companyId: string,
    requesterId: string,
    name: string,
    company: string,
    value: bigint,
    assignee: string,
    stage: PipelineStage,
    createdAt: string
  ): Promise<[] | [BackendOpportunity]>;
  updateOpportunityStage(
    companyId: string,
    requesterId: string,
    opportunityId: string,
    stage: PipelineStage
  ): Promise<boolean>;
  removeOpportunity(
    companyId: string,
    requesterId: string,
    opportunityId: string
  ): Promise<boolean>;
  getOpportunities(companyId: string): Promise<BackendOpportunity[]>;
}

export class ExternalBlob {
  private _bytes: Uint8Array;
  onProgress?: (progress: number) => void;

  constructor(bytes: Uint8Array) {
    this._bytes = bytes;
  }

  async getBytes(): Promise<Uint8Array> {
    return this._bytes;
  }

  static fromURL(_url: string): ExternalBlob {
    return new ExternalBlob(new Uint8Array());
  }
}

export interface CreateActorOptions {
  agentOptions?: {
    identity?: import("@dfinity/agent").Identity | Promise<import("@dfinity/agent").Identity>;
    host?: string;
  };
  agent?: unknown;
  processError?: (e: unknown) => never;
}

export function createActor(
  canisterId: string,
  _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
  _downloadFile: (bytes: Uint8Array) => Promise<ExternalBlob>,
  options?: CreateActorOptions & { agent?: unknown }
): backendInterface {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actorConfig: any = {
    canisterId,
    ...(options?.agent ? { agent: options.agent } : {}),
  };
  return Actor.createActor<backendInterface>(idlFactory, actorConfig) as unknown as backendInterface;
}
