import type { FrontendModuleContract } from "../../core/plugin-registry";
import { TaskTrackerPublicPage } from "./TaskTrackerPublicPage";

const module: FrontendModuleContract = {
  id: "task-tracker",
  publicPage: {
    path: "/projects/task-tracker",
    component: TaskTrackerPublicPage
  },
  permissions: ["task-tracker:read"]
};

export default module;
