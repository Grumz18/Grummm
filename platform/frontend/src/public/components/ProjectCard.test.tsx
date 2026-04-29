import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../../shared/theme/ThemeContext";
import { PreferencesProvider } from "../preferences";
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
  function renderCard(projectValue: PortfolioProject, href: string) {
    return render(
      <ThemeProvider>
        <PreferencesProvider>
          <MemoryRouter>
            <ProjectCard
              project={projectValue}
              theme="light"
              language="en"
              href={href}
            />
          </MemoryRouter>
        </PreferencesProvider>
      </ThemeProvider>
    );
  }

  test("renders a crawlable anchor with href", () => {
    renderCard(project, "/projects/task-tracker");

    const cardLink = screen.getByRole("link", { name: "Task Tracker" });
    expect(cardLink).toHaveAttribute("href", "/projects/task-tracker");
  });

  test("renders publication date for posts", () => {
    renderCard({ ...project, kind: "post", publishedAt: "2026-03-16T09:30:00.000Z" }, "/posts/task-tracker");

    expect(screen.getByText("Mar 16, 2026")).toBeInTheDocument();
  });
});
