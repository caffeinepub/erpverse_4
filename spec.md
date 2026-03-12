# ERPVerse

## Current State
All ERP modules (HR, Accounting, CRM, Inventory, Projects, Purchasing, Suppliers, Production, Workflow) store their data in React `useState([])` with no persistence. Data is lost on page refresh or navigation. ReportingModule shows hardcoded static values instead of reading from real module data.

## Requested Changes (Diff)

### Add
- `useLocalStorage<T>(key: string, initial: T)` hook in `src/hooks/useLocalStorage.ts` — persists state to localStorage, reads on mount, writes on change
- Company-scoped storage keys for all modules (format: `erpverse_{module}_{companyId}`)

### Modify
- **HRModule**: replace `useState<Employee[]>([])` with `useLocalStorage` using key `erpverse_hr_{companyId}`
- **AccountingModule**: replace `useState<Transaction[]>([])` with `useLocalStorage` using key `erpverse_accounting_{companyId}`
- **CRMModule**: replace `useState<Customer[]>([])` with `useLocalStorage` using key `erpverse_crm_{companyId}`
- **InventoryModule**: replace `useState<Product[]>([])` with `useLocalStorage` using key `erpverse_inventory_{companyId}`
- **ProjectsModule**: replace `useState<Project[]>([])` with `useLocalStorage` using key `erpverse_projects_{companyId}`
- **PurchasingModule**: replace `useState<Supplier[]>([])` and `useState<PurchaseOrder[]>([])` with `useLocalStorage` using keys `erpverse_purchasing_suppliers_{companyId}` and `erpverse_purchasing_orders_{companyId}`
- **SupplierModule**: replace supplier state with `useLocalStorage` using key `erpverse_suppliers_{companyId}`
- **ProductionModule**: replace `useState<ProductionOrder[]>([])` with `useLocalStorage` using key `erpverse_production_{companyId}`
- **WorkflowModule**: replace `useState<WorkflowTask[]>([])` with `useLocalStorage` using key `erpverse_workflow_{companyId}`
- **ReportingModule**: remove all hardcoded static data; read real data from localStorage keys for each module and compute actual stats (employee count, active employees, transaction totals, customer count, product count, project count, order count, task count). Show real KPI cards and a summary of module record counts instead of fake charts.

### Remove
- Hardcoded `MONTHLY_DATA` and `MODULE_USAGE` constants in ReportingModule

## Implementation Plan
1. Create `useLocalStorage` hook that accepts a key and default value, reads from localStorage on init, and syncs writes back
2. Update each module to use `useLocalStorage` for their primary data arrays, scoped by `company?.id`
3. Rewrite ReportingModule to read all module data from localStorage and display real computed stats
