import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import styled from "@emotion/styled";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
const JUGADORES_POR_PAGINA = 25;

interface Jugador {
  _id: string;
  name: string;
  foto?: string;
  dorsal: number;
  nacimiento?: string;
  nacionalidad?: string;
  posicion: string;
  retirado?: boolean;
  carrera?: { equipo: string; anio: number }[];
}

interface RespuestaJugadores {
  count: number;
  results: Jugador[];
  error?: string;
}

interface Usuario {
  nombre: string;
  rol: string;
}

function normalizar(texto: string) {
  return texto
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const Login = styled.main`
  max-width: 500px;
  margin: 60px auto;
  padding: 28px;
  border: 1px solid #d9dfd9;
  border-radius: 10px;
  background: #fffefa;
  color: #19352b;
  font-family: Arial, sans-serif;
`;

const Aplicacion = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f5f4ef;
  color: #19352b;
  font-family: Arial, sans-serif;

  @media (max-width: 650px) {
    flex-direction: column;
  }
`;

const BarraLateral = styled.aside`
  width: 210px;
  flex-shrink: 0;
  padding: 22px 16px;
  background: #153f34;
  color: white;

  h2 {
    margin: 0 0 28px;
    font-size: 19px;
  }

  @media (max-width: 650px) {
    width: auto;
    padding: 14px 16px;

    h2 {
      margin-bottom: 12px;
    }
  }
`;

const Menu = styled.div`
  padding: 12px;
  border-radius: 7px;
  background: #306b57;
  font-size: 14px;
`;

const ZonaPrincipal = styled.div`
  flex: 1;
  min-width: 0;
`;

const BarraSuperior = styled.header`
  min-height: 62px;
  padding: 10px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #e0e5e1;
  background: #fffefa;
  font-size: 13px;

  @media (max-width: 650px) {
    padding: 10px 16px;
    flex-wrap: wrap;
  }
`;

const Contenido = styled.main`
  max-width: 1100px;
  margin: 35px auto;
  padding: 0 24px;
`;

const Panel = styled.section`
  padding: 22px;
  border: 1px solid #d9dfd9;
  border-radius: 9px;
  background: #fffefa;
`;

const Controles = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin: 18px 0;
`;

const Entrada = styled.input`
  width: 100%;
  max-width: 420px;
  padding: 11px 12px;
  border: 1px solid #d1d9d2;
  border-radius: 7px;
  background: white;
  font-size: 14px;

  &:focus {
    outline: 2px solid #247d6144;
    border-color: #247d61;
  }
`;

const Selector = styled.select`
  padding: 11px 12px;
  border: 1px solid #d1d9d2;
  border-radius: 7px;
  background: white;
  color: #19352b;
`;

const Boton = styled.button`
  padding: 9px 14px;
  border: 0;
  border-radius: 7px;
  background: #21765b;
  color: white;
  cursor: pointer;

  &:hover {
    background: #195f49;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const BotonClaro = styled(Boton)`
  background: #e6f1eb;
  color: #19352b;

  &:hover {
    background: #d4e8dc;
  }
`;

const TablaContenedor = styled.div`
  overflow-x: auto;
  margin-top: 18px;

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 12px;
    border-bottom: 1px solid #e1e5df;
    text-align: left;
  }

  th {
    background: #f0f3ee;
    color: #52645a;
    font-size: 13px;
  }
`;

const Paginacion = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
  font-size: 14px;
`;

const MensajeError = styled.p`
  color: #a12626;
`;

const FondoFicha = styled.div`
  position: fixed;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #10231dcc;
`;

const Ficha = styled.section`
  width: 100%;
  max-width: 500px;
  padding: 24px;
  border-radius: 10px;
  background: #fffefa;

  img {
    width: 100px;
    height: 100px;
    border-radius: 8px;
    object-fit: cover;
  }
`;

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [orden, setOrden] = useState("az");
  const [seleccionado, setSeleccionado] = useState<Jugador | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function iniciarSesion(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setCargando(true);

    try {
      const respuesta = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || "No se pudo iniciar sesión.");
      }

      setUsuario({
        nombre: datos.usuario?.nombre || email,
        rol: datos.usuario?.rol || datos.usuario?.role || "Usuario",
      });

      setPassword("");
    } catch (fallo) {
      setError(
        fallo instanceof Error ? fallo.message : "Ha ocurrido un error.",
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (!usuario) return;

    const controlador = new AbortController();
    const signal = controlador.signal;

    async function cargarJugadores() {
      setCargando(true);
      setError("");

      try {
        const lista: Jugador[] = [];
        let total: number;

        do {
          const respuesta = await fetch(
            `${API}/jugadores?limit=100&offset=${lista.length}`,
            { signal },
          );

          const datos: RespuestaJugadores = await respuesta.json();

          if (!respuesta.ok) {
            throw new Error(
              datos.error || "No se pudieron cargar los jugadores.",
            );
          }

          total = datos.count;

          if (datos.results.length === 0) break;

          lista.push(...datos.results);
        } while (lista.length < total);

        if (!signal.aborted) {
          setJugadores(lista);
        }
      } catch (fallo) {
        if (!signal.aborted) {
          setError(
            fallo instanceof Error
              ? fallo.message
              : "No se pudieron cargar los jugadores.",
          );
        }
      } finally {
        if (!signal.aborted) {
          setCargando(false);
        }
      }
    }

    void cargarJugadores();

    return () => controlador.abort();
  }, [usuario]);

  const textoBuscado = normalizar(busqueda.trim());

  const filtrados = jugadores.filter((jugador) =>
    normalizar(jugador.name).includes(textoBuscado),
  );

  const ordenados = [...filtrados].sort((a, b) => {
    const comparacion = a.name.localeCompare(b.name, "es", {
      sensitivity: "base",
    });

    return orden === "az" ? comparacion : -comparacion;
  });

  const inicio = (pagina - 1) * JUGADORES_POR_PAGINA;
  const jugadoresPagina = ordenados.slice(
    inicio,
    inicio + JUGADORES_POR_PAGINA,
  );
  const totalPaginas = Math.ceil(ordenados.length / JUGADORES_POR_PAGINA);

  function cerrarSesion() {
    setUsuario(null);
    setEmail("");
    setPassword("");
    setJugadores([]);
    setBusqueda("");
    setPagina(1);
    setSeleccionado(null);
    setError("");
  }

  if (!usuario) {
    return (
      <Login>
        <h1>Proyecto React</h1>
        <p>Inicia sesión para ver el catálogo de jugadores.</p>

        <form onSubmit={iniciarSesion}>
          <p>
            <label>
              Correo electrónico
              <Entrada
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                required
              />
            </label>
          </p>

          <p>
            <label>
              Contraseña
              <Entrada
                type="password"
                value={password}
                onChange={(evento) => setPassword(evento.target.value)}
                required
              />
            </label>
          </p>

          <Boton type="submit" disabled={cargando}>
            {cargando ? "Entrando..." : "Iniciar sesión"}
          </Boton>
        </form>

        {error && <MensajeError role="alert">{error}</MensajeError>}
      </Login>
    );
  }

  return (
    <Aplicacion>
      <BarraLateral>
        <h2>⚽ Proyecto React</h2>
        <Menu>♟　Jugadores</Menu>
      </BarraLateral>

      <ZonaPrincipal>
        <BarraSuperior>
          <span>TEMPORADA 26/27</span>
          <span>
            Sesión de {usuario.nombre} · Rol: {usuario.rol}　
            <BotonClaro type="button" onClick={cerrarSesion}>
              Cerrar sesión
            </BotonClaro>
          </span>
        </BarraSuperior>

        <Contenido>
          <Panel>
            <small>CATÁLOGO</small>
            <h1>Jugadores</h1>

            <Controles>
              <Entrada
                type="search"
                placeholder="Buscar jugadores..."
                value={busqueda}
                onChange={(evento) => {
                  setBusqueda(evento.target.value);
                  setPagina(1);
                }}
              />

              <Selector
                aria-label="Ordenar jugadores"
                value={orden}
                onChange={(evento) => {
                  setOrden(evento.target.value);
                  setPagina(1);
                }}
              >
                <option value="az">Nombre A–Z</option>
                <option value="za">Nombre Z–A</option>
              </Selector>
            </Controles>

            <p>
              Mostrando {jugadoresPagina.length} de {filtrados.length} jugadores
            </p>

            {error && <MensajeError role="alert">{error}</MensajeError>}
            {cargando && <p>Cargando jugadores...</p>}

            {!cargando && !error && filtrados.length === 0 && (
              <p>
                {jugadores.length > 0
                  ? "No se encontraron jugadores con ese nombre."
                  : "No hay jugadores registrados."}
              </p>
            )}

            {!cargando && jugadoresPagina.length > 0 && (
              <>
                <TablaContenedor>
                  <table>
                    <thead>
                      <tr>
                        <th>Jugador</th>
                        <th>Dorsal</th>
                        <th>Posición</th>
                        <th>Ficha</th>
                      </tr>
                    </thead>

                    <tbody>
                      {jugadoresPagina.map((jugador) => (
                        <tr key={jugador._id}>
                          <td>{jugador.name}</td>
                          <td>{jugador.dorsal}</td>
                          <td>{jugador.posicion}</td>
                          <td>
                            <BotonClaro
                              type="button"
                              onClick={() => setSeleccionado(jugador)}
                            >
                              Ver ficha
                            </BotonClaro>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TablaContenedor>

                <Paginacion>
                  <span>
                    Página {pagina} de {totalPaginas}
                  </span>

                  <span>
                    <BotonClaro
                      type="button"
                      disabled={pagina === 1}
                      onClick={() => setPagina(pagina - 1)}
                    >
                      Anterior
                    </BotonClaro>{" "}
                    <BotonClaro
                      type="button"
                      disabled={pagina >= totalPaginas}
                      onClick={() => setPagina(pagina + 1)}
                    >
                      Siguiente
                    </BotonClaro>
                  </span>
                </Paginacion>
              </>
            )}
          </Panel>
        </Contenido>
      </ZonaPrincipal>

      {seleccionado && (
        <FondoFicha onClick={() => setSeleccionado(null)}>
          <Ficha
            role="dialog"
            aria-modal="true"
            onClick={(evento) => evento.stopPropagation()}
          >
            <h2>Ficha de jugador</h2>

            {seleccionado.foto && (
              <img
                src={seleccionado.foto}
                alt={`Foto de ${seleccionado.name}`}
              />
            )}

            <h3>{seleccionado.name}</h3>
            <p>Dorsal: {seleccionado.dorsal}</p>
            <p>Posición: {seleccionado.posicion}</p>
            <p>Nacionalidad: {seleccionado.nacionalidad || "No indicada"}</p>
            <p>Estado: {seleccionado.retirado ? "Retirado" : "En activo"}</p>

            <BotonClaro
              type="button"
              onClick={() => setSeleccionado(null)}
            >
              Cerrar ficha
            </BotonClaro>
          </Ficha>
        </FondoFicha>
      )}
    </Aplicacion>
  );
}