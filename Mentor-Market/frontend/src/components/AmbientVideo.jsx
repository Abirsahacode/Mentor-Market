import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useReducedMotion from "../hooks/useReducedMotion.js";

export default function AmbientVideo({ src, poster, label = "Preview video", className = "", decorative = false }) {
  const videoRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const [playing, setPlaying] = useState(!reducedMotion);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion) {
      video.pause();
      setPlaying(false);
    }
  }, [reducedMotion]);

  const toggle = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      try { await video.play(); setPlaying(true); } catch { setPlaying(false); }
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  return <>
    <video
      ref={videoRef}
      className={className}
      src={src}
      poster={poster}
      autoPlay={!reducedMotion}
      loop={!reducedMotion}
      muted
      playsInline
      preload="metadata"
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : label}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
    />
    <button className="ambient-video-toggle" type="button" onClick={toggle} aria-label={`${playing ? "Pause" : "Play"} ${label}`}>
      {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
    </button>
  </>;
}
