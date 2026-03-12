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
