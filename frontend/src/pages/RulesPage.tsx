import { useResource } from '../lib/useResource';
import { formatDate, humanize } from '../lib/format';
import { Badge, Card, Notice, Spinner } from '../components/ui';
import type { MovementRule } from '../lib/types';

/**
 * Inspeccion de la normativa configurada. Es una pantalla de solo lectura, pero
 * importante: permite auditar por que un movimiento exigio (o no) un documento,
 * sin tener que leer codigo.
 */
export const RulesPage = () => {
  const rules = useResource<MovementRule[]>('/movement-rules');
  const today = new Date();

  const isEffective = (rule: MovementRule) =>
    rule.active &&
    new Date(rule.effectiveFrom) <= today &&
    (!rule.effectiveTo || new Date(rule.effectiveTo) > today);

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Reglas documentales</h1>
          <p className="lead">
            Determinan qué traslados exigen DT-e u otro documento. Son datos con vigencia, no
            código: un cambio normativo se carga, no se despliega.
          </p>
        </div>
      </div>

      <Notice tone="info">
        La evaluación usa <strong>la fecha del traslado</strong>, no la de carga. Un movimiento
        anterior al 01/08/2026 no exige DT-e aunque se registre hoy, porque en esa fecha la norma
        todavía no regía.
      </Notice>

      {rules.loading && <Spinner />}
      {rules.error && <Notice tone="danger">{rules.error}</Notice>}

      <Card tight>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Regla</th>
                <th>Se aplica a</th>
                <th>Exige</th>
                <th>Vigencia</th>
                <th className="num">Prioridad</th>
              </tr>
            </thead>
            <tbody>
              {(rules.data ?? []).map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <strong>{rule.name}</strong>
                    {rule.legalReference && (
                      <div className="small muted">{rule.legalReference}</div>
                    )}
                  </td>
                  <td className="small">
                    {[
                      rule.movementType && humanize(rule.movementType),
                      rule.originType && `desde ${humanize(rule.originType)}`,
                      rule.destinationType && `hacia ${humanize(rule.destinationType)}`,
                    ]
                      .filter(Boolean)
                      .join(' · ') || <span className="faint">Cualquier traslado</span>}
                  </td>
                  <td>
                    {rule.requiresDocument ? (
                      <Badge tone="warn">{rule.requiredDocumentType}</Badge>
                    ) : (
                      <span className="small faint">Nada</span>
                    )}
                  </td>
                  <td className="small nowrap">
                    {formatDate(rule.effectiveFrom)} →{' '}
                    {rule.effectiveTo ? formatDate(rule.effectiveTo) : 'vigente'}{' '}
                    {isEffective(rule) ? (
                      <Badge tone="ok">Vigente hoy</Badge>
                    ) : (
                      <Badge>No vigente</Badge>
                    )}
                  </td>
                  <td className="num">{rule.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Cómo se elige la regla">
        <div className="small stack">
          <p>
            Se buscan todas las reglas activas y vigentes a la fecha del traslado cuyos criterios
            coincidan. Un criterio vacío actúa como comodín.
          </p>
          <p>
            Gana la de <strong>menor prioridad numérica</strong>, es decir, la más específica. Ante
            empate, la de vigencia más reciente. El movimiento guarda cuál se le aplicó, así que la
            decisión queda auditable aunque después se modifique la regla.
          </p>
        </div>
      </Card>
    </div>
  );
};
