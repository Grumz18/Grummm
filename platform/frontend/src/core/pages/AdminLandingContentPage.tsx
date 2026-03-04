import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  readLandingContent,
  saveLandingContent,
  type LandingContent
} from "../../public/data/landing-content-store";

interface LandingDraft extends LandingContent {}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Не удалось прочитать файл."));
    reader.readAsDataURL(file);
  });
}

export function AdminLandingContentPage() {
  const [landingDraft, setLandingDraft] = useState<LandingDraft>(() => readLandingContent());

  async function handleLandingPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setLandingDraft((current) => ({ ...current, aboutPhoto: dataUrl }));
  }

  function handleLandingSave(event: FormEvent) {
    event.preventDefault();
    const saved = saveLandingContent(landingDraft);
    setLandingDraft(saved);
  }

  return (
    <section className="admin-landing-content">
      <article className="admin-card admin-landing-editor">
        <h1>Контент главной страницы</h1>
        <p className="admin-muted">
          Отдельный блок для настройки первого экрана и секции «Обо мне» на двух языках.
        </p>
        <form className="admin-form" onSubmit={handleLandingSave}>
          <label>
            Hero (RU): надзаголовок
            <input
              value={landingDraft.heroEyebrow.ru}
              onChange={(e) =>
                setLandingDraft((current) => ({
                  ...current,
                  heroEyebrow: { ...current.heroEyebrow, ru: e.target.value }
                }))
              }
            />
          </label>
          <label>
            Hero (EN): eyebrow
            <input
              value={landingDraft.heroEyebrow.en}
              onChange={(e) =>
                setLandingDraft((current) => ({
                  ...current,
                  heroEyebrow: { ...current.heroEyebrow, en: e.target.value }
                }))
              }
            />
          </label>
          <label>
            Hero (RU): заголовок
            <textarea
              rows={2}
              value={landingDraft.heroTitle.ru}
              onChange={(e) =>
                setLandingDraft((current) => ({
                  ...current,
                  heroTitle: { ...current.heroTitle, ru: e.target.value }
                }))
              }
            />
          </label>
          <label>
            Hero (EN): title
            <textarea
              rows={2}
              value={landingDraft.heroTitle.en}
              onChange={(e) =>
                setLandingDraft((current) => ({
                  ...current,
                  heroTitle: { ...current.heroTitle, en: e.target.value }
                }))
              }
            />
          </label>
          <label>
            Hero (RU): описание
            <textarea
              rows={3}
              value={landingDraft.heroDescription.ru}
              onChange={(e) =>
                setLandingDraft((current) => ({
                  ...current,
                  heroDescription: { ...current.heroDescription, ru: e.target.value }
                }))
              }
            />
          </label>
          <label>
            Hero (EN): description
            <textarea
              rows={3}
              value={landingDraft.heroDescription.en}
              onChange={(e) =>
                setLandingDraft((current) => ({
                  ...current,
                  heroDescription: { ...current.heroDescription, en: e.target.value }
                }))
              }
            />
          </label>
          <label>
            Обо мне (RU): заголовок
            <input
              value={landingDraft.aboutTitle.ru}
              onChange={(e) =>
                setLandingDraft((current) => ({
                  ...current,
                  aboutTitle: { ...current.aboutTitle, ru: e.target.value }
                }))
              }
            />
          </label>
          <label>
            About me (EN): title
            <input
              value={landingDraft.aboutTitle.en}
              onChange={(e) =>
                setLandingDraft((current) => ({
                  ...current,
                  aboutTitle: { ...current.aboutTitle, en: e.target.value }
                }))
              }
            />
          </label>
          <label>
            Обо мне (RU): текст
            <textarea
              rows={3}
              value={landingDraft.aboutText.ru}
              onChange={(e) =>
                setLandingDraft((current) => ({
                  ...current,
                  aboutText: { ...current.aboutText, ru: e.target.value }
                }))
              }
            />
          </label>
          <label>
            About me (EN): text
            <textarea
              rows={3}
              value={landingDraft.aboutText.en}
              onChange={(e) =>
                setLandingDraft((current) => ({
                  ...current,
                  aboutText: { ...current.aboutText, en: e.target.value }
                }))
              }
            />
          </label>
          <label>
            Портфолио (RU): заголовок
            <input
              value={landingDraft.portfolioTitle.ru}
              onChange={(e) =>
                setLandingDraft((current) => ({
                  ...current,
                  portfolioTitle: { ...current.portfolioTitle, ru: e.target.value }
                }))
              }
            />
          </label>
          <label>
            Portfolio (EN): title
            <input
              value={landingDraft.portfolioTitle.en}
              onChange={(e) =>
                setLandingDraft((current) => ({
                  ...current,
                  portfolioTitle: { ...current.portfolioTitle, en: e.target.value }
                }))
              }
            />
          </label>
          <label>
            Портфолио (RU): текст
            <textarea
              rows={3}
              value={landingDraft.portfolioText.ru}
              onChange={(e) =>
                setLandingDraft((current) => ({
                  ...current,
                  portfolioText: { ...current.portfolioText, ru: e.target.value }
                }))
              }
            />
          </label>
          <label>
            Portfolio (EN): text
            <textarea
              rows={3}
              value={landingDraft.portfolioText.en}
              onChange={(e) =>
                setLandingDraft((current) => ({
                  ...current,
                  portfolioText: { ...current.portfolioText, en: e.target.value }
                }))
              }
            />
          </label>
          <label>
            Фото для блока «Обо мне»
            <input type="file" accept="image/*" onChange={(e) => void handleLandingPhoto(e)} />
          </label>
          {landingDraft.aboutPhoto ? (
            <img className="admin-landing-editor__preview" src={landingDraft.aboutPhoto} alt="about-preview" />
          ) : null}
          <button type="submit">Сохранить контент главной</button>
        </form>
      </article>
    </section>
  );
}
