import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectCard } from "./ProjectCard";
import type { PortfolioProject } from "../types";

const project: PortfolioProject = {
  id: "task-tracker",
  title: { en: "Task Tracker", ru: "Трекер задач" },
  summary: { en: "Summary", ru: "Описание" },
  description: { en: "Long description", ru: "Детальное описание" },
  tags: ["React"],
  heroImage: { light: "light.png", dark: "dark.png" },
  screenshots: [{ light: "s1.png", dark: "s1d.png" }]
};

describe("ProjectCard", () => {
  test("click navigates directly", async () => {
    const user = userEvent.setup();
    const onNavigate = jest.fn();

    render(
      <ProjectCard
        project={project}
        theme="light"
        language="en"
        onNavigate={onNavigate}
      />
    );

    const card = screen.getByRole("link", { name: "Task Tracker" });
    await user.click(card);

    expect(onNavigate).toHaveBeenCalledWith("task-tracker");
  });

  test("keyboard activation navigates directly", async () => {
    const user = userEvent.setup();
    const onNavigate = jest.fn();

    render(
      <ProjectCard
        project={project}
        theme="light"
        language="en"
        onNavigate={onNavigate}
      />
    );

    const card = screen.getByRole("link", { name: "Task Tracker" });
    card.focus();
    await user.keyboard("{Enter}");

    expect(onNavigate).toHaveBeenCalledWith("task-tracker");
  });
});