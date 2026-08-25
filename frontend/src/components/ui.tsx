import type { ReactNode } from 'react';
import { useEffect, useState, type FormEvent } from 'react';

export const Spinner = ({ label }: { label?: string }) => (
  <span className="row small muted">
    <span className="spinner" aria-hidden="true" />
    {label ?? 'Cargando…'}
  </span>
);

export const Card = ({
  title,
  actions,
  children,
  tight,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  tight?: boolean;
}) => (
  <section className="card">
    {(title || actions) && (
      <header className="card-header">
        {typeof title === 'string' ? <h2>{title}</h2> : title}
        {actions && <div className="row">{actions}</div>}
      </header>
    )}
    <div className={tight ? 'card-body tight' : 'card-body'}>{children}</div>
  </section>
);

export const Stat = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) => (
  <div className="card stat">
    <div className="label">{label}</div>
    <div className="value">{value}</div>
    {hint && <div className="hint">{hint}</div>}
  </div>
);

type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'accent' | 'neutral';

export const Badge = ({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) => (
  <span className={tone === 'neutral' ? 'badge' : `badge ${tone}`}>{children}</span>
);

/** Mapea los estados del dominio a un color, para que se lean de un vistazo. */
export const statusTone = (status: string | null | undefined): Tone => {
  switch (status) {
    case 'ACTIVE':
    case 'RECEIVED':
    case 'CLOSED':
    case 'APPROVED':
    case 'COMPLETED':
    case 'SYNCHRONIZED':
    case 'ACCEPTED':
      return 'ok';
    case 'DRAFT':
    case 'PENDING':
    case 'PENDING_VERIFICATION':
    case 'PENDING_SYNC':
    case 'PARTIALLY_RECEIVED':
    case 'PARTIAL':
    case 'IN_TRANSIT':
      return 'warn';
    case 'REJECTED':
    case 'CANCELLED':
    case 'BLOCKED':
    case 'ERROR':
    case 'FAILED':
      return 'danger';
    case 'DISPATCHED':
    case 'ISSUED':
    case 'OPEN':
    case 'FILLED':
    case 'IN_STOCK':
      return 'info';
    default:
      return 'neutral';
  }
};

export const StatusBadge = ({ status }: { status: string | null | undefined }) => (
  <Badge tone={statusTone(status)}>{status ?? '—'}</Badge>
);

export const Notice = ({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warn' | 'danger' | 'ok';
  children: ReactNode;
}) => (
  <div className={`notice ${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
    <div>{children}</div>
  </div>
);

export const Empty = ({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className="empty">
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {action && <div className="mt">{action}</div>}
  </div>
);

export const Modal = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="ghost" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------
// Formularios declarativos
// --------------------------------------------------------------------------

export interface FieldSpec {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'date' | 'datetime-local' | 'textarea' | 'select';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  help?: string;
  step?: string;
  defaultValue?: string;
  /** Ocupa el ancho completo de la fila. */
  full?: boolean;
}

export const Field = ({
  spec,
  value,
  onChange,
}: {
  spec: FieldSpec;
  value: string;
  onChange: (value: string) => void;
}) => {
  const id = `field-${spec.name}`;
  const common = {
    id,
    name: spec.name,
    required: spec.required,
    placeholder: spec.placeholder,
    value,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => onChange(event.target.value),
  };

  return (
    <div className="field" style={spec.full ? { gridColumn: '1 / -1' } : undefined}>
      <label htmlFor={id}>
        {spec.label}
        {spec.required && <span aria-hidden="true"> *</span>}
      </label>
      {spec.type === 'textarea' ? (
        <textarea {...common} />
      ) : spec.type === 'select' ? (
        <select {...common}>
          <option value="">— Seleccionar —</option>
          {spec.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input {...common} type={spec.type ?? 'text'} step={spec.step} />
      )}
      {spec.help && <span className="help">{spec.help}</span>}
    </div>
  );
};

export const useForm = (fields: FieldSpec[]) => {
  const initial = Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? '']));
  const [values, setValues] = useState<Record<string, string>>(initial);
  const set = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));
  const reset = () => setValues(initial);
  return { values, set, reset, setValues };
};

/** Formulario con campos declarativos, estado de envio y error visible. */
export const FormFields = ({
  fields,
  values,
  onChange,
  onSubmit,
  submitLabel,
  onCancel,
  busy,
  error,
  children,
}: {
  fields: FieldSpec[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  onSubmit: (event: FormEvent) => void;
  submitLabel: string;
  onCancel?: () => void;
  busy?: boolean;
  error?: string | null;
  children?: ReactNode;
}) => (
  <form onSubmit={onSubmit} noValidate={false}>
    {error && <Notice tone="danger">{error}</Notice>}
    <div className="form-row">
      {fields.map((spec) => (
        <Field
          key={spec.name}
          spec={spec}
          value={values[spec.name] ?? ''}
          onChange={(value) => onChange(spec.name, value)}
        />
      ))}
    </div>
    {children}
    <div className="form-actions">
      {onCancel && (
        <button type="button" className="ghost" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
      )}
      <button type="submit" className="primary" disabled={busy}>
        {busy && <span className="spinner" aria-hidden="true" />}
        {submitLabel}
      </button>
    </div>
  </form>
);
