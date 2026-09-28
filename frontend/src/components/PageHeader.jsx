export default function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="page-heading">
      <div>
        <h1 tabIndex={-1}>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
