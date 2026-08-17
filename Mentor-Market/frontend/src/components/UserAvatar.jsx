import { useEffect, useState } from "react";

const palettes = [
  ["#d9f2e9", "#087f65"],
  ["#ddecff", "#176fba"],
  ["#f3e5d8", "#8a4e25"],
  ["#eee7d3", "#735d18"],
  ["#ebe5f8", "#6843a5"],
  ["#e6eaed", "#3d454b"],
];

const initials = (name = "Mentor") => name
  .split(" ")
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join("")
  .toUpperCase();

export default function UserAvatar({ name = "Mentor Market member", size = "medium", verified = false, image }) {
  const index = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palettes.length;
  const [background, color] = palettes[index];
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [image]);
  return (
    <span
      className={`user-avatar avatar-${size}`}
      style={{ "--avatar-bg": background, "--avatar-ink": color }}
      role="img"
      aria-label={`${name}${verified ? ", verified" : ""}`}
      title={name}
    >
      {image && !imageFailed
        ? <img src={image} alt="" loading="lazy" onError={() => setImageFailed(true)} />
        : initials(name)}
      {verified && <i aria-hidden="true">✓</i>}
    </span>
  );
}
