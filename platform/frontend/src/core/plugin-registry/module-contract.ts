import type { ComponentType } from "react";

export type ModuleComponent = ComponentType;

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
