import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AdminProjectsWorkspace } from "./AdminProjectsWorkspace";

jest.mock("../../public/data/project-store", () => ({
  useProjectPosts: () => [],
  createProjectWithOptions: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn()
}));

describe("AdminProjectsWorkspace", () => {
  test("shows conditional template instructions for Python", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminProjectsWorkspace />
      </MemoryRouter>
    );

    expect(screen.queryByText(/Загрузите Python-файлы сервиса/i)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/Тип шаблона/i), "Python");

    expect(screen.getByText(/Загрузите Python-файлы сервиса/i)).toBeInTheDocument();
    expect(screen.getByText(/Перетащите сюда frontend-сборку/i)).toBeInTheDocument();
  });
});

