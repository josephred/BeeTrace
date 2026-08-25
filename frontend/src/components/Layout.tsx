import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useSync } from '../lib/sync';
import { formatRelative } from '../lib/format';
import { Badge } from './ui';
import { InstallPrompt } from './InstallPrompt';

const Logo = () => (
  <svg width="24" height="24" viewBox="0 0 64 64" aria-hidden="true">
    <rect width="64" height="64" rx="14" fill="var(--accent)" />
    <g fill="none" stroke="var(--accent-contrast)" strokeWidth="3" strokeLinejoin="round">
      <path d="M32 12l7 4v8l-7 4-7-4v-8z" />
      <path d="M18 34l7 4v8l-7 4-7-4v-8z" />
      <path d="M46 34l7 4v8l-7 4-7-4v-8z" />
    </g>
    <path
      d="M32 32l7 4v8l-7 4-7-4v-8z"
      fill="var(--text)"
      stroke="var(--accent-contrast)"
      strokeWidth="3"
      strokeLinejoin="round"
    />
  </svg>
);

const Icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  ),
  trace: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="6" y1="9" x2="6" y2="15" />
      <path d="M18 9a9 9 0 0 1-9 9" />
      <circle cx="18" cy="9" r="3" />
    </svg>
  ),
  producers: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  establishments: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  apiaries: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z" />
      <path d="M12 12l8-4.5" />
      <path d="M12 12v8" />
      <path d="M12 12L4 7.5" />
    </svg>
  ),
  movements: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </svg>
  ),
  extractions: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
    </svg>
  ),
  lots: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 12.5-8.58 3.91a2 2 0 0 1-1.66 0L2.6 12.5" />
      <path d="m22 17.5-8.58 3.91a2 2 0 0 1-1.66 0L2.6 17.5" />
    </svg>
  ),
  drums: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
    </svg>
  ),
  rules: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  audit: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  pending: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  ),
  menu: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  ),
};

const NAV = [
  {
    section: 'Trazabilidad',
    items: [
      { to: '/', label: 'Panel', icon: Icons.dashboard, end: true },
      { to: '/trace', label: 'Consultar trazabilidad', icon: Icons.trace },
    ],
  },
  {
    section: 'Registros',
    items: [
      { to: '/producers', label: 'Productores', icon: Icons.producers },
      { to: '/establishments', label: 'Establecimientos', icon: Icons.establishments },
      { to: '/apiaries', label: 'Apiarios', icon: Icons.apiaries },
    ],
  },
  {
    section: 'Operación',
    items: [
      { to: '/movements', label: 'Movimientos', icon: Icons.movements },
      { to: '/extractions', label: 'Extracciones', icon: Icons.extractions },
      { to: '/lots', label: 'Lotes', icon: Icons.lots },
      { to: '/drums', label: 'Tambores', icon: Icons.drums },
    ],
  },
  {
    section: 'Control',
    items: [
      { to: '/rules', label: 'Reglas documentales', icon: Icons.rules },
      { to: '/audit', label: 'Auditoría', icon: Icons.audit },
    ],
  },
];

export const Layout = () => {
  const { user, logout } = useAuth();
  const { online, syncing, pendingCount, failedCount, lastSyncAt, flush } = useSync();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Cerrar el menú móvil automáticamente al navegar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app">
      {/* Backdrop oscuro para móvil cuando el menú está abierto */}
      {mobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="row" style={{ gap: '0.6rem', alignItems: 'center' }}>
            <Logo />
            <span>BeeTrace</span>
          </div>
          <button
            type="button"
            className="mobile-close-btn ghost icon-only"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            {Icons.close}
          </button>
        </div>

        <nav className="nav">
          {NAV.map((group) => (
            <div key={group.section}>
              <div className="nav-section">{group.section}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="nav-item-content">
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </span>
                </NavLink>
              ))}
            </div>
          ))}
          <div>
            <div className="nav-section">Sincronización</div>
            <NavLink to="/pending" onClick={() => setMobileMenuOpen(false)}>
              <span className="nav-item-content">
                <span className="nav-icon">{Icons.pending}</span>
                <span className="nav-label">Pendientes</span>
              </span>
              {pendingCount + failedCount > 0 && (
                <Badge tone={failedCount > 0 ? 'danger' : 'warn'}>
                  {pendingCount + failedCount}
                </Badge>
              )}
            </NavLink>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="small">
            <strong>{user?.fullName}</strong>
          </div>
          <div className="small faint">
            {user?.role} · sinc. {formatRelative(lastSyncAt)}
          </div>
        </div>
      </aside>

      <div className="main">
        {!online && (
          <div className="offline-bar">
            <span className="badge danger">
              <span className="dot" /> Sin conexión
            </span>
            Trabajando con datos locales. Lo que registres se enviará al recuperar señal.
          </div>
        )}
        {online && syncing && (
          <div className="offline-bar syncing">
            <span className="spinner" aria-hidden="true" />
            Sincronizando operaciones pendientes…
          </div>
        )}

        <header className="topbar">
          <button
            type="button"
            className="menu-toggle ghost icon-only"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Abrir menú de navegación"
          >
            {Icons.menu}
          </button>

          <div className="mobile-brand">
            <Logo />
            <span>BeeTrace</span>
          </div>

          <InstallPrompt />
          <div className="spacer" />

          {online ? (
            <Badge tone="ok">
              <span className="dot" /> <span className="hide-on-mobile">En línea</span>
            </Badge>
          ) : (
            <Badge tone="danger">
              <span className="dot" /> <span className="hide-on-mobile">Offline</span>
            </Badge>
          )}

          {(pendingCount > 0 || failedCount > 0) && online && (
            <button type="button" className="small" onClick={() => void flush()} disabled={syncing}>
              Sincronizar
            </button>
          )}

          <button type="button" className="ghost small" onClick={() => void handleLogout()}>
            Salir
          </button>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
