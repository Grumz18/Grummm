import type { FrontendModuleContract } from "../../core/plugin-registry";
import { TaskTrackerBoardPage } from "./TaskTrackerBoardPage";
import { TaskTrackerPrivatePage } from "./TaskTrackerPrivatePage";
import { TaskTrackerPublicPage } from "./TaskTrackerPublicPage";

const module: FrontendModuleContract = {
  id: "task-tracker",
  publicPage: {
    path: "/projects/task-tracker",
    component: TaskTrackerPublicPage
  },
  privateApp: {
    path: "/app/task-tracker",
    component: TaskTrackerPrivatePage
  },
  routes: [
    {
      path: "/app/task-tracker/board",
      component: TaskTrackerBoardPage
    }
  ],
  permissions: ["task-tracker:read"]
};

export default module;
