// Adapted from Light Bootstrap Dashboard React by Creative Tim (MIT).
// Copyright 2022 Creative Tim.
// Original sources and license: SOURCE.md and LICENSE.md in this folder.
const sections = [
  { id: "workspace", label: "Таблицы" },
  { id: "help", label: "Справка" },
];

export default function DashboardLayout({
  section,
  onSectionChange,
  children,
}) {
  return (
    <div className="wrapper">
      <aside className="sidebar">
        <div className="sidebar-wrapper">
          <div className="logo">
            <span className="simple-text">Проекты и задачи</span>
          </div>
          <nav aria-label="Основное меню">
            <ul className="nav">
              {sections.map((item) => (
                <li
                  key={item.id}
                  className={section === item.id ? "active" : ""}
                >
                  <button
                    className="nav-link"
                    onClick={() => onSectionChange(item.id)}
                    aria-current={section === item.id ? "page" : undefined}
                  >
                    <span className="menu-icon" aria-hidden="true">
                      {item.id === "workspace" ? "▤" : "?"}
                    </span>
                    <p>{item.label}</p>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
      <div className="main-panel">
        <header className="navbar">
          <div className="container-fluid">
            <h1 className="navbar-brand">
              {sections.find((item) => item.id === section)?.label}
            </h1>
          </div>
        </header>
        <main className="content">
          <div className="container-fluid">{children}</div>
        </main>
      </div>
    </div>
  );
}
