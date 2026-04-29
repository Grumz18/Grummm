import { useEffect, useMemo, useState } from "react";
import ContentCard from "./ContentCard";
import type { Language, PortfolioProject } from "../types";
import { getPortfolioKind, getPublicEntryPath } from "../data/project-store";

export type KindFilterValue = "all" | "project" | "post";

const TOPIC_PREVIEW_LIMIT = 4;

interface ContentFeedProps {
  language: Language;
  items: PortfolioProject[];
  kind: KindFilterValue;
  topic: string | null;
  onKindChange: (kind: KindFilterValue) => void;
  onTopicToggle: (topic: string) => void;
  showKindFilter?: boolean;
  emptyMessage?: string;
}

function kindLabel(kind: KindFilterValue, language: Language): string {
  if (kind === "project") {
    return language === "ru" ? "Проекты" : "Projects";
  }
  if (kind === "post") {
    return language === "ru" ? "Посты" : "Posts";
  }
  return language === "ru" ? "Все" : "All";
}

function topicChipAll(language: Language): string {
  return language === "ru" ? "Темы" : "Topics";
}

export function ContentFeed({
  language,
  items,
  kind,
  topic,
  onKindChange,
  onTopicToggle,
  showKindFilter = true,
  emptyMessage
}: ContentFeedProps) {
  const topics = useMemo(
    () => Array.from(new Set(items.flatMap((item) => item.tags).map((tag) => tag.trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b)),
    [items]
  );

  const [topicsExpanded, setTopicsExpanded] = useState(false);

  useEffect(() => {
    if (topic && topics.indexOf(topic) >= TOPIC_PREVIEW_LIMIT) {
      setTopicsExpanded(true);
    }
  }, [topic, topics]);

  const filtered = items.filter((item) => {
    const itemKind = getPortfolioKind(item);
    if (kind !== "all" && itemKind !== kind) {
      return false;
    }
    if (topic && !item.tags.includes(topic)) {
      return false;
    }
    return true;
  });
  const visibleTopics = topicsExpanded ? topics : topics.slice(0, TOPIC_PREVIEW_LIMIT);
  const hasHiddenTopics = topics.length > TOPIC_PREVIEW_LIMIT;

  return (
    <section className="rs-feed">
      <div className="rs-feed__controls">
        {showKindFilter ? (
          <div className="rs-feed__kinds" role="tablist" aria-label={language === "ru" ? "Фильтр по типу" : "Kind filter"}>
            {(["all", "project", "post"] as KindFilterValue[]).map((value) => (
              <button
                key={value}
                type="button"
                className={kind === value ? "rs-kind-filter is-active" : "rs-kind-filter"}
                onClick={() => onKindChange(value)}
              >
                {kindLabel(value, language)}
              </button>
            ))}
          </div>
        ) : null}

        <div className={topicsExpanded ? "rs-feed__topics is-expanded" : "rs-feed__topics"}>
          <span className="rs-feed__topics-label">{topicChipAll(language)}</span>
          <div className="rs-feed__topics-list">
            {visibleTopics.map((value) => (
              <button
                key={value}
                type="button"
                className={topic === value ? "rs-topic-chip is-active" : "rs-topic-chip"}
                onClick={() => onTopicToggle(value)}
              >
                {value}
              </button>
            ))}
          </div>
          {hasHiddenTopics ? (
            <button
              type="button"
              className="rs-topics-toggle"
              aria-expanded={topicsExpanded}
              aria-label={topicsExpanded ? (language === "ru" ? "Свернуть темы" : "Collapse topics") : (language === "ru" ? "Показать все темы" : "Show all topics")}
              onClick={() => setTopicsExpanded((value) => !value)}
            >
              <span className="rs-topics-toggle__chevron" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="rs-feed__grid">
          {filtered.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              language={language}
              href={getPublicEntryPath(item)}
            />
          ))}
        </div>
      ) : (
        <p className="rs-feed__empty">{emptyMessage ?? (language === "ru" ? "Ничего не найдено." : "No entries found.")}</p>
      )}
    </section>
  );
}
