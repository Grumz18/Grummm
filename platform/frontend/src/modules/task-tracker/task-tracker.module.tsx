import type { FrontendModuleContract } from "../../core/plugin-registry";
import { TaskTrackerBoardPage } from "./TaskTrackerBoardPage";
import { TaskTrackerCreatePage } from "./TaskTrackerCreatePage";
import { TaskTrackerPrivatePage } from "./TaskTrackerPrivatePage";
import { TaskTrackerPublicPage } from "./TaskTrackerPublicPage";

const module: FrontendModuleContract = {
  id: "task-tracker",
  publicPage: {
    path: "/projects/task-tracker",
    component: TaskTrackerPublicPage
  },
  privateApp: {
    path: "/app/tasks",
    component: TaskTrackerPrivatePage
  },
  routes: [
    {
      path: "/app/tasks/board",
      component: TaskTrackerBoardPage
    },
    {
      path: "/app/tasks/create",
      component: TaskTrackerCreatePage
    }
  ],
  permissions: ["task-tracker:read"]
};

export default module;
