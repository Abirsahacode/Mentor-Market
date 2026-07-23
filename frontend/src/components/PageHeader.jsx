import { useId } from "react";

export default function PageHeader({ eyebrow, title, description, actions, headingLevel = 1 }) {
  const titleId = useId();
  const Heading = headingLevel === 2 ? "h2" : "h1";
  return (
    <header className="page-header" aria-labelledby={titleId}>
      <div className="page-title-group">
        {eyebrow && <span className="eyebrow"><i aria-hidden="true" />{eyebrow}</span>}
        <Heading id={titleId}>{title}</Heading>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
