import { Play, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function DemoVideo({ src, poster, title = "Tutor demo lesson", label = "Watch demo", variant = "button", captionsSrc, transcript }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
    const focusable = () => [...(dialogRef.current?.querySelectorAll(focusableSelector) || [])];
    const frame = window.requestAnimationFrame(() => (closeRef.current || dialogRef.current)?.focus());
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
      else triggerRef.current?.focus();
    };
  }, [open]);

  if (!src) return null;
  return <>
    <button ref={triggerRef} type="button" className={`demo-video-trigger demo-video-${variant}`} onClick={() => setOpen(true)} aria-label={`${label}: ${title}`}><Play size={variant === "icon" ? 18 : 15} fill="currentColor" />{variant !== "icon" && <span>{label}</span>}</button>
    {open && createPortal(
      <div className="media-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <div ref={dialogRef} className="media-dialog" tabIndex="-1">
          <div className="media-dialog-head"><div><span>Demo lesson</span><h2>{title}</h2></div><button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Close video"><X size={20} /></button></div>
          <video controls autoPlay playsInline poster={poster} src={src}>{captionsSrc ? <track kind="captions" src={captionsSrc} srcLang="en" label="English" default /> : null}Your browser does not support embedded video.</video>
          <p>This is a short service preview. Message the tutor for lesson details and availability.</p>
          {transcript ? <details className="media-transcript"><summary>Read transcript</summary><p>{transcript}</p></details> : null}
        </div>
      </div>, document.body,
    )}
  </>;
}
