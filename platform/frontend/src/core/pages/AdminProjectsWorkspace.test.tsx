import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
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
      <MemoryRouter>
        <AdminProjectsWorkspace />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: /static frontend only, without server runtime/i }));

    const pythonOption = screen.getByRole("button", { name: /python service with requirements and app files/i });
    expect(pythonOption).toBeDisabled();
    expect(screen.getByText(/runtime-backed templates are disabled on this deployment/i)).toBeInTheDocument();
  });
});
