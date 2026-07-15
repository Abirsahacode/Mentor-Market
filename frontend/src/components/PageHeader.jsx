import { useId } from "react";

export default function PageHeader({ eyebrow, title, description, actions }) {
  const titleId = useId();
  return (
    <header className="page-header" aria-labelledby={titleId}>
      <div className="page-title-group">
        {eyebrow && <span className="eyebrow"><i aria-hidden="true" />{eyebrow}</span>}
        <h1 id={titleId}>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
