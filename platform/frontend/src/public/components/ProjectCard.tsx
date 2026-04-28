import ContentCard from "./ContentCard";
import type { Language, PortfolioProject, ThemeMode } from "../types";

interface ProjectCardProps {
  project: PortfolioProject;
  theme: ThemeMode;
  language: Language;
  href: string;
}

export function ProjectCard({ project, theme: _theme, language, href }: ProjectCardProps) {
  return <ContentCard item={project} language={language} href={href} />;
}
