import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";

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

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
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
      setError(fallo instanceof Error ? fallo.message : "Ha ocurrido un error.");
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
            throw new Error(datos.error || "No se pudieron cargar los jugadores.");
          }

          total = datos.count;
          if (datos.results.length === 0) break;

          lista.push(...datos.results);
        } while (lista.length < total);

        if (!signal.aborted) setJugadores(lista);
      } catch (fallo) {
        if (!signal.aborted) {
          const mensaje =
            fallo instanceof Error
              ? fallo.message
              : "No se pudieron cargar los jugadores.";
          setError(mensaje);
        }
      } finally {
        if (!signal.aborted) setCargando(false);
      }
    }

    void cargarJugadores();
    return () => controlador.abort();
  }, [usuario]);

  const textoBuscado = normalizar(busqueda.trim());
  const filtrados = jugadores.filter((jugador) =>
    normalizar(jugador.name).includes(textoBuscado),
  );
  const inicio = (pagina - 1) * JUGADORES_POR_PAGINA;
  const jugadoresPagina = filtrados.slice(inicio, inicio + JUGADORES_POR_PAGINA);
  const totalPaginas = Math.ceil(filtrados.length / JUGADORES_POR_PAGINA);

  function cerrarSesion() {
    setUsuario(null);
    setEmail("");
    setPassword("");
    setJugadores([]);
    setBusqueda("");
    setPagina(1);
    setSeleccionado(null);
    setCargando(false);
    setError("");
  }

  if (!usuario) {
    return (
      <main className="login">
        <h1>Proyecto React</h1>
        <p>Inicia sesión para ver el catálogo de jugadores.</p>

        <form onSubmit={iniciarSesion}>
          <p>
            <label>
              Correo electrónico
              <input
                className="entrada"
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
              <input
                className="entrada"
                type="password"
                value={password}
                onChange={(evento) => setPassword(evento.target.value)}
                required
              />
            </label>
          </p>

          <button className="boton" type="submit" disabled={cargando}>
            {cargando ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>

        {error && <p className="mensaje-error" role="alert">{error}</p>}
      </main>
    );
  }

  return (
    <div className="aplicacion">
      <aside className="barra-lateral">
        <h2>Proyecto React</h2>
        <div className="menu">♟　Jugadores</div>
      </aside>

      <div className="zona-principal">
        <header className="barra-superior">
          <span>TEMPORADA 26/27</span>
          <span>
            Sesión de {usuario.nombre} · Rol: {usuario.rol}　
            <button className="boton boton-claro" onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </span>
        </header>

        <main className="contenido">
          <section className="panel">
            <small>CATÁLOGO</small>
            <h1>Jugadores</h1>

            <input
              className="entrada"
              type="search"
              placeholder="Buscar jugadores..."
              value={busqueda}
              onChange={(evento) => {
                setBusqueda(evento.target.value);
                setPagina(1);
              }}
            />

            <p>
              Mostrando {jugadoresPagina.length} de {filtrados.length} jugadores
            </p>

            {error && <p className="mensaje-error" role="alert">{error}</p>}
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
                <div className="tabla-contenedor">
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
                            <button
                              className="boton boton-claro"
                              onClick={() => setSeleccionado(jugador)}
                            >
                              Ver ficha
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="paginacion">
                  <span>Página {pagina} de {totalPaginas}</span>
                  <span>
                    <button
                      className="boton boton-claro"
                      disabled={pagina === 1}
                      onClick={() => setPagina(pagina - 1)}
                    >
                      Anterior
                    </button>{" "}
                    <button
                      className="boton boton-claro"
                      disabled={pagina === totalPaginas}
                      onClick={() => setPagina(pagina + 1)}
                    >
                      Siguiente
                    </button>
                  </span>
                </div>
              </>
            )}
          </section>
        </main>
      </div>

      {seleccionado && (
        <div className="fondo-ficha" onClick={() => setSeleccionado(null)}>
          <section
            className="ficha"
            role="dialog"
            aria-modal="true"
            onClick={(evento) => evento.stopPropagation()}
          >
            <h2>Ficha de jugador</h2>

            {seleccionado.foto && (
              <img src={seleccionado.foto} alt={`Foto de ${seleccionado.name}`} />
            )}

            <h3>{seleccionado.name}</h3>
            <p>Dorsal: {seleccionado.dorsal}</p>
            <p>Posición: {seleccionado.posicion}</p>
            <p>Nacionalidad: {seleccionado.nacionalidad || "No indicada"}</p>
            <p>Estado: {seleccionado.retirado ? "Retirado" : "En activo"}</p>

            <button
              className="boton boton-claro"
              onClick={() => setSeleccionado(null)}
            >
              Cerrar ficha
            </button>
          </section>
        </div>
      )}
    </div>
  );
}