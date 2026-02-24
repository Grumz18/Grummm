export type ModuleComponent = unknown;

export interface ModuleRoute {
  path: string;
  component: ModuleComponent;
}

export interface FrontendModuleContract {
  id: string;
  publicPage?: ModuleRoute;
  privateApp?: ModuleRoute;
  routes?: ModuleRoute[];
  permissions?: string[];
}
