import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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

const NAV = [
  {
    section: 'Trazabilidad',
    items: [
      { to: '/', label: 'Panel', end: true },
      { to: '/trace', label: 'Consultar trazabilidad' },
    ],
  },
  {
    section: 'Registros',
    items: [
      { to: '/producers', label: 'Productores' },
      { to: '/establishments', label: 'Establecimientos' },
      { to: '/apiaries', label: 'Apiarios' },
    ],
  },
  {
    section: 'Operación',
    items: [
      { to: '/movements', label: 'Movimientos' },
      { to: '/extractions', label: 'Extracciones' },
      { to: '/lots', label: 'Lotes' },
      { to: '/drums', label: 'Tambores' },
    ],
  },
  {
    section: 'Control',
    items: [
      { to: '/rules', label: 'Reglas documentales' },
      { to: '/audit', label: 'Auditoría' },
    ],
  },
];

export const Layout = () => {
  const { user, logout } = useAuth();
  const { online, syncing, pendingCount, failedCount, lastSyncAt, flush } = useSync();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <Logo />
          BeeTrace
        </div>
        <nav className="nav">
          {NAV.map((group) => (
            <div key={group.section}>
              <div className="nav-section">{group.section}</div>
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
          <div>
            <div className="nav-section">Sincronización</div>
            <NavLink to="/pending">
              Pendientes
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
            {user?.role} · última sincronización {formatRelative(lastSyncAt)}
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
          <InstallPrompt />
          <div className="spacer" />
          {online ? (
            <Badge tone="ok">
              <span className="dot" /> En línea
            </Badge>
          ) : (
            <Badge tone="danger">
              <span className="dot" /> Offline
            </Badge>
          )}
          {(pendingCount > 0 || failedCount > 0) && online && (
            <button type="button" className="small" onClick={() => void flush()} disabled={syncing}>
              Sincronizar ahora
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
