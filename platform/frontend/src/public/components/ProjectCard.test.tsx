import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProjectCard } from "./ProjectCard";
import type { PortfolioProject } from "../types";

const project: PortfolioProject = {
  id: "task-tracker",
  title: { en: "Task Tracker", ru: "Task Tracker" },
  summary: { en: "Summary", ru: "Summary" },
  description: { en: "Long description", ru: "Long description" },
  tags: ["React"],
  heroImage: { light: "light.png", dark: "dark.png" },
  screenshots: [{ light: "s1.png", dark: "s1d.png" }]
};

describe("ProjectCard", () => {
  test("renders a crawlable anchor with href", () => {
    render(
      <MemoryRouter>
        <ProjectCard
          project={project}
          theme="light"
          language="en"
          href="/projects/task-tracker"
        />
      </MemoryRouter>
    );

    const cardLink = screen.getByRole("link", { name: "Task Tracker" });
    expect(cardLink).toHaveAttribute("href", "/projects/task-tracker");
  });

  test("renders publication date for posts", () => {
    render(
      <MemoryRouter>
        <ProjectCard
          project={{ ...project, kind: "post", publishedAt: "2026-03-16T09:30:00.000Z" }}
          theme="light"
          language="en"
          href="/posts/task-tracker"
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/Mar/i)).toBeInTheDocument();
  });
});
