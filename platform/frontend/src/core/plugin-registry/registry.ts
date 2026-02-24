import type { FrontendModuleContract } from "./module-contract";

type ModuleExport = { default: FrontendModuleContract };

const moduleFiles = import.meta.glob<ModuleExport>("../../modules/**/*.module.{ts,tsx}", {
  eager: true
});

function assertRouteZones(moduleDef: FrontendModuleContract): void {
  if (moduleDef.publicPage?.path?.startsWith("/app")) {
    throw new Error(`Module '${moduleDef.id}': publicPage path cannot start with '/app'.`);
  }

  if (moduleDef.privateApp && !moduleDef.privateApp.path.startsWith("/app")) {
    throw new Error(`Module '${moduleDef.id}': privateApp path must start with '/app'.`);
  }

  if (moduleDef.routes) {
    for (const route of moduleDef.routes) {
      if (!route.path.startsWith("/")) {
        throw new Error(`Module '${moduleDef.id}': route path must start with '/'.`);
      }
    }
  }
}

function assertContract(moduleDef: FrontendModuleContract): void {
  if (!moduleDef.id || moduleDef.id.trim().length === 0) {
    throw new Error("Module contract requires non-empty 'id'.");
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(moduleDef.id)) {
    throw new Error(`Module '${moduleDef.id}': id must be kebab-case.`);
  }

  assertRouteZones(moduleDef);
}

export function loadModules(): FrontendModuleContract[] {
  const loaded = Object.entries(moduleFiles).map(([file, exported]) => {
    if (!exported?.default) {
      throw new Error(`Module file '${file}' must export default module contract.`);
    }

    assertContract(exported.default);
    return exported.default;
  });

  const idSet = new Set<string>();
  for (const moduleDef of loaded) {
    if (idSet.has(moduleDef.id)) {
      throw new Error(`Duplicate module id '${moduleDef.id}' detected.`);
    }
    idSet.add(moduleDef.id);
  }

  return loaded;
}

export const moduleRegistry = loadModules();
