import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useSync } from '../lib/sync';
import { useResource } from '../lib/useResource';
import { formatQuantity, formatRelative, humanize } from '../lib/format';
import { Card, Empty, Notice, Stat, StatusBadge } from '../components/ui';
import type { Apiary, Drum, Establishment, Extraction, Lot, Movement, Paginated } from '../lib/types';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { online, pendingCount, failedCount, lastSyncAt } = useSync();

  const isProducer = user?.role === 'PRODUCTOR';
  const isSala = user?.role === 'SALA';
  const isAcopioOrSimilar =
    user?.role === 'ACOPIADOR' || user?.role === 'FRACCIONADOR' || user?.role === 'EXPORTADOR';

  const movements = useResource<Paginated<Movement>>('/movements?pageSize=5');
  const lots = useResource<Paginated<Lot>>(!isProducer ? '/lots?pageSize=5' : null);
  const apiaries = useResource<Paginated<Apiary>>(
    isProducer || user?.role === 'ADMIN' || user?.role === 'AUDITOR' ? '/apiaries?pageSize=5' : null,
  );
  const establishments = useResource<Paginated<Establishment>>(
    isProducer ? '/establishments?pageSize=1' : null,
  );
  const extractions = useResource<Paginated<Extraction>>(isSala ? '/extractions?pageSize=1' : null);
  const drums = useResource<Paginated<Drum>>(isAcopioOrSimilar ? '/drums?pageSize=1' : null);

  const stale = movements.fromCache || lots.fromCache || apiaries.fromCache;

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Hola, {user?.fullName.split(' ')[0]}</h1>
          <p className="lead">
            Estado de la operación y accesos rápidos al circuito de trazabilidad.
          </p>
        </div>
        <Link to="/trace" className="btn btn-primary">
          Consultar trazabilidad
        </Link>
      </div>

      {stale && (
        <Notice tone="warn">
          Mostrando datos guardados localmente ({formatRelative(lastSyncAt)}). Se actualizarán al
          recuperar la conexión.
        </Notice>
      )}

      {failedCount > 0 && (
        <Notice tone="danger">
          Hay {failedCount} operación(es) que el servidor rechazó.{' '}
          <Link to="/pending">Revisar la cola</Link>.
        </Notice>
      )}

      <div className="grid cols-4">
        <Stat
          label="Movimientos"
          value={movements.data?.meta.total ?? '—'}
          hint="registrados en su ámbito"
        />
        {isProducer ? (
          <>
            <Stat
              label="Apiarios"
              value={apiaries.data?.meta.total ?? '—'}
              hint="unidades productivas"
            />
            <Stat
              label="Establecimientos"
              value={establishments.data?.meta.total ?? '—'}
              hint="predios registrados"
            />
          </>
        ) : isSala ? (
          <>
            <Stat
              label="Extracciones"
              value={extractions.data?.meta.total ?? '—'}
              hint="procesos realizados"
            />
            <Stat
              label="Lotes"
              value={lots.data?.meta.total ?? '—'}
              hint="unidades de trazabilidad"
            />
          </>
        ) : isAcopioOrSimilar ? (
          <>
            <Stat
              label="Lotes"
              value={lots.data?.meta.total ?? '—'}
              hint="unidades de acopio"
            />
            <Stat
              label="Tambores"
              value={drums.data?.meta.total ?? '—'}
              hint="en inventario"
            />
          </>
        ) : (
          <>
            <Stat
              label="Lotes"
              value={lots.data?.meta.total ?? '—'}
              hint="unidades de trazabilidad"
            />
            <Stat
              label="Apiarios"
              value={apiaries.data?.meta.total ?? '—'}
              hint="unidades productivas"
            />
          </>
        )}
        <Stat
          label="Pendientes de enviar"
          value={pendingCount + failedCount}
          hint={online ? 'se sincronizan solas' : 'esperando señal'}
        />
      </div>

      <div className="grid cols-2">
        <Card
          title="Últimos movimientos"
          actions={
            <Link to="/movements" className="btn small">
              Ver todos
            </Link>
          }
          tight
        >
          {movements.data && movements.data.data.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Material</th>
                    <th className="num">Cantidad</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.data.data.map((movement) => (
                    <tr key={movement.id}>
                      <td className="mono">
                        <Link to={`/movements/${movement.id}`}>{movement.code}</Link>
                      </td>
                      <td>{humanize(movement.materialType)}</td>
                      <td className="num">{formatQuantity(movement.quantity, movement.unit)}</td>
                      <td>
                        <StatusBadge status={movement.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="Todavía no hay movimientos"
              description="Un movimiento conecta un origen con un destino y es el evento que dispara toda la trazabilidad."
              action={
                <Link to="/movements" className="btn btn-primary">
                  Registrar el primero
                </Link>
              }
            />
          )}
        </Card>

        {isProducer ? (
          <Card
            title="Mis apiarios"
            actions={
              <Link to="/apiaries" className="btn small">
                Ver todos
              </Link>
            }
            tight
          >
            {apiaries.data && apiaries.data.data.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th className="num">Colmenas</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiaries.data.data.map((apiary) => (
                      <tr key={apiary.id}>
                        <td className="mono">{apiary.code}</td>
                        <td>{apiary.name ?? '—'}</td>
                        <td className="num">{apiary.hiveCount}</td>
                        <td>
                          <StatusBadge status={apiary.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                title="Todavía no hay apiarios"
                description="Los apiarios representan las colmenas geolocalizadas dentro de su establecimiento."
                action={
                  <Link to="/apiaries" className="btn btn-primary">
                    Registrar apiario
                  </Link>
                }
              />
            )}
          </Card>
        ) : (
          <Card
            title="Últimos lotes"
            actions={
              <Link to="/lots" className="btn small">
                Ver todos
              </Link>
            }
            tight
          >
            {lots.data && lots.data.data.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Tipo</th>
                      <th className="num">Disponible</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lots.data.data.map((lot) => (
                      <tr key={lot.id}>
                        <td className="mono">
                          <Link to={`/lots/${lot.id}`}>{lot.code}</Link>
                        </td>
                        <td>{humanize(lot.lotType)}</td>
                        <td className="num">
                          {formatQuantity(lot.availableQuantity, lot.unit)}
                        </td>
                        <td>
                          <StatusBadge status={lot.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                title="Todavía no hay lotes"
                description="El lote es la unidad lógica de trazabilidad: agrupa lo recibido o extraído y se materializa en tambores."
              />
            )}
          </Card>
        )}
      </div>
    </div>
  );
};
