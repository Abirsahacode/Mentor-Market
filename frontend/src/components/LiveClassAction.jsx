import { ExternalLink, Play, Video, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getLiveClassActionLabel,
  getLiveClassConfig,
  getProviderLabel,
  getVideoEmbedUrl,
} from "../utils/liveClass.js";

function LiveClassPreview({ href, provider, title, onClose }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const embedUrl = getVideoEmbedUrl(href, provider);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    const frame = window.requestAnimationFrame(() => (closeRef.current || dialogRef.current)?.focus());
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [onClose]);

  return createPortal(
    <div
      className="media-modal live-class-modal"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div ref={dialogRef} className="media-dialog live-class-dialog" tabIndex="-1">
        <div className="media-dialog-head">
          <div>
            <span>{getProviderLabel(provider)} preview</span>
            <h2>{title}</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close preview">
            <X size={20} />
          </button>
        </div>
        {embedUrl ? (
          <iframe
            className="live-class-embed"
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="live-class-fallback">
            <Video size={28} />
            <p>This video link could not be embedded. Open it in a new tab instead.</p>
            <a className="button button-small" href={href} target="_blank" rel="noreferrer">
              Open {getProviderLabel(provider)}
            </a>
          </div>
        )}
        <p className="live-class-note">Use the join button when your class starts, or open the original link in a new tab.</p>
      </div>
    </div>,
    document.body,
  );
}

export default function LiveClassAction({
  href,
  variant = "link",
  purpose = "join",
  className = "",
  title = "Live class session",
  children,
}) {
  const config = getLiveClassConfig(href);
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!config.href) return null;

  const label = children || getLiveClassActionLabel(config, purpose);
  const isVideo = config.type === "video";

  const open = () => {
    if (isVideo) setPreviewOpen(true);
    else window.open(config.href, "_blank", "noopener,noreferrer");
  };

  const sharedClass = `live-class-action live-class-action-${variant} live-class-${config.provider} ${className}`.trim();

  return (
    <>
      {variant === "button" ? (
        <button type="button" className={`button button-tiny ${sharedClass}`} onClick={open}>
          {isVideo ? <Play size={13} /> : <ExternalLink size={13} />}
          <span>{label}</span>
        </button>
      ) : (
        <button type="button" className={sharedClass} onClick={open}>
          {isVideo ? <Play size={14} /> : <ExternalLink size={14} />}
          <span>{label}</span>
        </button>
      )}
      {previewOpen && (
        <LiveClassPreview
          href={config.href}
          provider={config.provider}
          title={title}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}