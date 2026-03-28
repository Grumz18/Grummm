import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { useDropzone } from "react-dropzone";
import type { PortfolioContentBlock, PortfolioContentBlockType } from "../../public/types";

interface AdminPostBlocksEditorProps {
  blocks: PortfolioContentBlock[];
  disabled: boolean;
  onChange: (blocks: PortfolioContentBlock[]) => void;
  onCreateImageDataUrl: (file: File) => Promise<string>;
  onUploadVideoFile: (file: File) => Promise<string>;
}

interface PostVideoUploadFieldProps {
  block: PortfolioContentBlock;
  disabled: boolean;
  onUploadVideoFile: (file: File) => Promise<string>;
  onUpdate: (updater: (block: PortfolioContentBlock) => PortfolioContentBlock) => void;
}

interface BlockInserterProps {
  disabled: boolean;
  onInsert: (type: PortfolioContentBlockType) => void;
}

const BLOCK_OPTIONS: Array<{ type: PortfolioContentBlockType; label: string; icon: string }> = [
  { type: "paragraph", label: "Paragraph", icon: "¶" },
  { type: "subheading", label: "Subheading", icon: "H" },
  { type: "callout", label: "Callout", icon: "❝" },
  { type: "numberedList", label: "List", icon: "#" },
  { type: "image", label: "Image", icon: "▣" },
  { type: "video", label: "Video", icon: "▶" }
];

function getBlockLabel(type: PortfolioContentBlockType): string {
  return BLOCK_OPTIONS.find((option) => option.type === type)?.label ?? type;
}

function createBlock(type: PortfolioContentBlockType): PortfolioContentBlock {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type,
    content: type === "image" ? undefined : { en: "", ru: "" },
    imageUrl: type === "image" ? "" : undefined,
    videoUrl: type === "video" ? "" : undefined,
    posterUrl: undefined,
    pinEnabled: undefined,
    scrollSpan: undefined
  };
}

function getTextRows(type: PortfolioContentBlockType): number {
  if (type === "subheading") {
    return 2;
  }

  if (type === "callout") {
    return 4;
  }

  if (type === "numberedList") {
    return 6;
  }

  return 5;
}

function getTextHelp(type: PortfolioContentBlockType): string | null {
  if (type === "numberedList") {
    return "Each new line becomes the next numbered item.";
  }

  if (type === "callout") {
    return "Use this for a highlighted editorial statement or pull-quote.";
  }

  return null;
}

function BlockInserter({ disabled, onInsert }: BlockInserterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className={`block-inserter${open ? " is-open" : ""}`} ref={ref}>
      <button
        type="button"
        className="block-inserter__trigger"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-label="Insert block"
      >
        <span className="block-inserter__line" />
        <span className="block-inserter__plus">+</span>
        <span className="block-inserter__line" />
      </button>

      {open ? (
        <div className="block-inserter__picker" role="listbox" aria-label="Choose block type">
          {BLOCK_OPTIONS.map((option) => (
            <button
              key={option.type}
              type="button"
              className="block-inserter__option"
              onClick={() => {
                onInsert(option.type);
                setOpen(false);
              }}
              disabled={disabled}
              title={option.label}
            >
              <span className="block-inserter__icon">{option.icon}</span>
              <span className="block-inserter__label">{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PostVideoUploadField({ block, disabled, onUploadVideoFile, onUpdate }: PostVideoUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleUpload(file: File) {
    setUploadError("");
    setUploading(true);

    try {
      const videoUrl = await onUploadVideoFile(file);
      onUpdate((current) => ({
        ...current,
        videoUrl
      }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload video.");
    } finally {
      setUploading(false);
    }
  }

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { "video/*": [".mp4", ".webm", ".mov", ".m4v"] },
    multiple: false,
    disabled: disabled || uploading,
    noClick: true,
    onDropAccepted: (files) => {
      const file = files[0];
      if (file) {
        void handleUpload(file);
      }
    },
    onDropRejected: () => {
      setUploadError("Use a single supported video file within the current upload limit.");
    }
  });

  return (
    <div className="admin-post-block__video">
      <div className="admin-post-block__video-dropzone-wrap">
        <div
          {...getRootProps()}
          className={`admin-post-block__video-dropzone${isDragActive ? " is-active" : ""}${uploading ? " is-uploading" : ""}`}
        >
          <input {...getInputProps()} />
          <strong>{uploading ? "Uploading video..." : "Drop video here"}</strong>
          <p className="admin-muted">
            {isDragActive
              ? "Release to upload and attach this scene automatically."
              : "Drag an MP4, WebM, MOV, or M4V into this area or choose a file. The editor uploads it and fills the public URL for you."}
          </p>
          <button type="button" onClick={open} disabled={disabled || uploading}>
            {block.videoUrl ? "Replace video" : "Choose video"}
          </button>
        </div>
        {block.videoUrl ? <p className="admin-muted">Video source ready. The public URL has been attached to this block.</p> : null}
        {uploadError ? <p className="admin-error">{uploadError}</p> : null}
      </div>

      <div className="admin-post-block__fields">
        <label>
          Source URL
          <input
            type="text"
            inputMode="url"
            spellCheck={false}
            placeholder="Automatically filled after upload or use an absolute/relative URL"
            value={block.videoUrl ?? ""}
            onChange={(event) => onUpdate((current) => ({
              ...current,
              videoUrl: event.target.value
            }))}
          />
        </label>
        <label>
          Poster URL (optional)
          <input
            type="text"
            inputMode="url"
            spellCheck={false}
            placeholder="Leave empty or use an absolute/relative image URL"
            value={block.posterUrl ?? ""}
            onChange={(event) => onUpdate((current) => ({
              ...current,
              posterUrl: event.target.value.trim().length > 0 ? event.target.value : undefined
            }))}
          />
        </label>
      </div>

      <p className="admin-muted">This video starts automatically once when the block enters the viewport.</p>

      <div className="admin-post-block__fields">
        <label>
          Caption (EN)
          <textarea
            rows={3}
            value={block.content?.en ?? ""}
            onChange={(event) => onUpdate((current) => ({
              ...current,
              content: { ...(current.content ?? { en: "", ru: "" }), en: event.target.value }
            }))}
          />
        </label>
        <label>
          Caption (RU)
          <textarea
            rows={3}
            value={block.content?.ru ?? ""}
            onChange={(event) => onUpdate((current) => ({
              ...current,
              content: { ...(current.content ?? { en: "", ru: "" }), ru: event.target.value }
            }))}
          />
        </label>
      </div>
    </div>
  );
}

export function AdminPostBlocksEditor({
  blocks,
  disabled,
  onChange,
  onCreateImageDataUrl,
  onUploadVideoFile
}: AdminPostBlocksEditorProps) {
  function insertBlockAt(index: number, type: PortfolioContentBlockType) {
    const next = [...blocks];
    next.splice(index, 0, createBlock(type));
    onChange(next);
  }

  function updateBlock(blockId: string, updater: (block: PortfolioContentBlock) => PortfolioContentBlock) {
    onChange(blocks.map((block) => (block.id === blockId ? updater(block) : block)));
  }

  function moveBlock(blockId: string, direction: -1 | 1) {
    const index = blocks.findIndex((block) => block.id === blockId);
    if (index < 0) {
      return;
    }

    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= blocks.length) {
      return;
    }

    const next = [...blocks];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    onChange(next);
  }

  async function handleImageSelect(blockId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const imageUrl = await onCreateImageDataUrl(file);
    updateBlock(blockId, (current) => ({ ...current, imageUrl }));
    event.target.value = "";
  }

  return (
    <section className="admin-post-blocks">
      <div className="admin-post-blocks__header">
        <div>
          <strong>Post body</strong>
          <p className="admin-muted">Build the post from localized blocks. Click <strong>+</strong> between blocks to insert a paragraph, subheading, callout, numbered list, image, or video scene.</p>
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="admin-post-blocks__empty">
          <BlockInserter disabled={disabled} onInsert={(type) => insertBlockAt(0, type)} />
          <p className="admin-muted">Use the plus button above to add the first block.</p>
        </div>
      ) : (
        <div className="admin-post-blocks__list">
          <BlockInserter disabled={disabled} onInsert={(type) => insertBlockAt(0, type)} />

          {blocks.map((block, index) => {
            const isImage = block.type === "image";
            const isVideo = block.type === "video";
            const isText = !isImage && !isVideo;
            const textHelp = getTextHelp(block.type);

            return (
              <div key={block.id} className="admin-post-block__wrap">
                <article className="admin-post-block">
                  <div className="admin-post-block__toolbar">
                    <span className="admin-status-badge admin-status-badge--neutral">{getBlockLabel(block.type)}</span>
                    <div className="admin-post-block__toolbar-actions">
                      <button type="button" onClick={() => moveBlock(block.id, -1)} disabled={disabled || index === 0}>Up</button>
                      <button type="button" onClick={() => moveBlock(block.id, 1)} disabled={disabled || index === blocks.length - 1}>Down</button>
                      <button type="button" onClick={() => onChange(blocks.filter((item) => item.id !== block.id))} disabled={disabled}>Remove</button>
                    </div>
                  </div>

                  {isText ? (
                    <div className="admin-post-block__fields">
                      <label>
                        Content (EN)
                        <textarea
                          rows={getTextRows(block.type)}
                          placeholder={block.type === "numberedList" ? "1st item\n2nd item\n3rd item" : undefined}
                          value={block.content?.en ?? ""}
                          onChange={(event) => updateBlock(block.id, (current) => ({
                            ...current,
                            content: { ...(current.content ?? { en: "", ru: "" }), en: event.target.value }
                          }))}
                        />
                      </label>
                      <label>
                        Content (RU)
                        <textarea
                          rows={getTextRows(block.type)}
                          placeholder={block.type === "numberedList" ? "Первый пункт\nВторой пункт\nТретий пункт" : undefined}
                          value={block.content?.ru ?? ""}
                          onChange={(event) => updateBlock(block.id, (current) => ({
                            ...current,
                            content: { ...(current.content ?? { en: "", ru: "" }), ru: event.target.value }
                          }))}
                        />
                      </label>
                      {textHelp ? <p className="admin-muted admin-post-block__hint">{textHelp}</p> : null}
                    </div>
                  ) : isImage ? (
                    <div className="admin-post-block__image">
                      <label>
                        Image or GIF
                        <input type="file" accept="image/*" onChange={(event) => void handleImageSelect(block.id, event)} />
                      </label>
                      {block.imageUrl ? <img src={block.imageUrl} alt="Post block preview" loading="lazy" /> : <p className="admin-muted">Upload one static image or animated GIF for this block.</p>}
                    </div>
                  ) : (
                    <PostVideoUploadField
                      block={block}
                      disabled={disabled}
                      onUploadVideoFile={onUploadVideoFile}
                      onUpdate={(updater) => updateBlock(block.id, updater)}
                    />
                  )}
                </article>

                <BlockInserter disabled={disabled} onInsert={(type) => insertBlockAt(index + 1, type)} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
