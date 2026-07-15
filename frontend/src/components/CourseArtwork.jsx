const artworkTheme = (subject = "") => {
  const value = String(subject).toLowerCase();
  if (/math|calculus|algebra|geometry|statistic/.test(value)) return "math";
  if (/physics|science|astronomy/.test(value)) return "physics";
  if (/chem|biology|lab/.test(value)) return "science";
  if (/code|program|computer|web|software/.test(value)) return "code";
  if (/english|ielts|language|writing|speaking/.test(value)) return "language";
  return "studio";
};

function ArtworkMark({ theme }) {
  if (theme === "math") {
    return <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="31" cy="35" r="14" /><path d="M17 91 58 20l41 71Z" /><path d="M36 68h44" /></svg>;
  }
  if (theme === "physics") {
    return <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="8" className="is-solid" /><ellipse cx="60" cy="60" rx="46" ry="19" /><ellipse cx="60" cy="60" rx="46" ry="19" transform="rotate(60 60 60)" /><ellipse cx="60" cy="60" rx="46" ry="19" transform="rotate(120 60 60)" /></svg>;
  }
  if (theme === "science") {
    return <svg viewBox="0 0 120 120" aria-hidden="true"><path d="M47 16h26M53 16v31L25 94c-4 7 1 13 9 13h52c8 0 13-6 9-13L67 47V16" /><path d="M36 81c16-8 32 9 49-1" /><circle cx="47" cy="89" r="4" className="is-solid" /><circle cx="71" cy="73" r="3" className="is-solid" /></svg>;
  }
  if (theme === "code") {
    return <svg viewBox="0 0 120 120" aria-hidden="true"><path d="m47 29-31 31 31 31M73 29l31 31-31 31M67 17 52 103" /></svg>;
  }
  if (theme === "language") {
    return <svg viewBox="0 0 120 120" aria-hidden="true"><path d="M17 29c16-8 29-6 43 5v65c-14-11-27-13-43-5ZM103 29c-16-8-29-6-43 5v65c14-11 27-13 43-5Z" /><path d="M29 49c7-2 13-1 19 3M29 63c7-2 13-1 19 3M91 49c-7-2-13-1-19 3M91 63c-7-2-13-1-19 3" /></svg>;
  }
  return <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="42" /><circle cx="60" cy="60" r="15" /><path d="m60 6 8 35 35 19-35 19-8 35-8-35-35-19 35-19Z" /></svg>;
}

export default function CourseArtwork({ subject = "Learning", className = "", decorative = true }) {
  const theme = artworkTheme(subject);
  const accessibility = decorative
    ? { "aria-hidden": "true" }
    : { role: "img", "aria-label": `${subject || "Course"} artwork` };

  return (
    <span className={`course-artwork course-artwork-${theme} ${className}`.trim()} {...accessibility}>
      <span className="course-artwork-grid" />
      <span className="course-artwork-orbit course-artwork-orbit-a" />
      <span className="course-artwork-orbit course-artwork-orbit-b" />
      <span className="course-artwork-mark"><ArtworkMark theme={theme} /></span>
      <span className="course-artwork-index"><i /><i /><i /></span>
    </span>
  );
}

export { artworkTheme };
