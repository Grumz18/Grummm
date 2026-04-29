import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { NotificationProvider } from "../components/Notifications";
import { AdminProjectsWorkspace } from "./AdminProjectsWorkspace";

jest.mock("../../public/data/project-store", () => ({
  useProjectPosts: () => [],
  getPortfolioKind: () => "project",
  createProjectWithOptions: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn()
}));

describe("AdminProjectsWorkspace", () => {
  test("marks runtime templates as unavailable by default", async () => {
    const user = userEvent.setup();

    render(
      <NotificationProvider>
        <MemoryRouter>
          <AdminProjectsWorkspace />
        </MemoryRouter>
      </NotificationProvider>
    );

    await user.click(screen.getByRole("button", { name: /create project/i }));
    await user.click(screen.getByRole("button", { name: /runtime template/i }));

    const staticOption = screen.getByRole("option", { name: /static frontend only, without server runtime/i });
    const pythonOption = screen.getByRole("option", { name: /python service with requirements and app files/i });
    expect(staticOption).not.toBeDisabled();
    expect(pythonOption).toBeDisabled();
    expect(screen.getByText(/runtime-backed templates are disabled/i)).toBeInTheDocument();
  });
});
