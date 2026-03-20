interface ProjectsCatalogHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  count: number;
  backLabel: string;
  onBack: () => void;
}

export function ProjectsCatalogHeader({ eyebrow, title, description, count, backLabel, onBack }: ProjectsCatalogHeaderProps) {
  return (
    <header className="catalog-header liquid-glass" data-gsap="reveal">
      <div className="liquid-glass__sheen" aria-hidden="true" />
      <div className="liquid-glass__grain" aria-hidden="true" />
      <div className="liquid-glass__content catalog-header__shell">
        <div className="catalog-header__heading">
          <p className="catalog-header__eyebrow">{eyebrow}</p>
          <div className="catalog-header__title-row">
            <h1 className="catalog-header__title">{title}</h1>
            <span className="catalog-header__count" aria-label={`Count: ${count}`}>
              {count}
            </span>
          </div>
          <p className="catalog-header__description">{description}</p>
        </div>

        <div className="catalog-header__actions">
          <button className="inline-back" type="button" onClick={onBack} data-gsap-button>
            {backLabel}
          </button>
        </div>
      </div>
    </header>
  );
}
