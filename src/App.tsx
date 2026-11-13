import { useEffect, useState } from "react";
import type { FormEvent } from "react";

const API = import.meta.env.VITE_API_URL;

interface Jugador {
  _id: string;
  name: string;
  foto: string;
  dorsal: number;
  nacimiento: string;
  nacionalidad: string;
  posicion: string;
  retirado: boolean;
  carrera: { equipo: string; anio: number }[];
}

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState("");
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [jugadorSeleccionado, setJugadorSeleccionado] =
    useState<Jugador | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

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

      setToken(datos.token);
      setUsuario(datos.usuario);
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
    if (!token) return;

    const controlador = new AbortController();

    const temporizador = window.setTimeout(async () => {
      setCargando(true);
      setError("");

      try {
        const parametros = new URLSearchParams({
          limit: "25",
          offset: "0",
        });

        if (busqueda.trim()) {
          parametros.set("name", busqueda.trim());
        }

        const respuesta = await fetch(
          `${API}/jugadores?${parametros.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controlador.signal,
          },
        );

        const pagina = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            pagina.error || "No se pudieron cargar los jugadores.",
          );
        }

        setJugadores(pagina.results);
      } catch (fallo) {
        if (fallo instanceof Error && fallo.name !== "AbortError") {
          setError(fallo.message);
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    }, 400);

    return () => {
      window.clearTimeout(temporizador);
      controlador.abort();
    };
  }, [token, busqueda]);

  async function abrirFicha(id: string) {
    setError("");
    setCargando(true);

    try {
      const respuesta = await fetch(
        `${API}/jugadores/${encodeURIComponent(id)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const jugador = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(jugador.error || "No se pudo cargar la ficha.");
      }

      setJugadorSeleccionado(jugador);
    } catch (fallo) {
      setError(
        fallo instanceof Error ? fallo.message : "Ha ocurrido un error.",
      );
    } finally {
      setCargando(false);
    }
  }

  async function cerrarSesion() {
    try {
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } finally {
      setToken("");
      setUsuario(null);
      setJugadores([]);
      setJugadorSeleccionado(null);
      setBusqueda("");
      setError("");
    }
  }

  if (!usuario) {
    return (
      <main>
        <h1>Proyecto React</h1>

        <form onSubmit={iniciarSesion}>
          <h2>Iniciar sesión</h2>

          <p>
            <label>
              Correo electrónico{" "}
              <input
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                required
              />
            </label>
          </p>

          <p>
            <label>
              Contraseña{" "}
              <input
                type="password"
                value={password}
                onChange={(evento) => setPassword(evento.target.value)}
                required
              />
            </label>
          </p>

          <button disabled={cargando}>
            {cargando ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>

        {error && <p role="alert">{error}</p>}
      </main>
    );
  }

  return (
    <main>
      <header>
        <h1>Proyecto React</h1>
        <p>
          Sesión de {usuario.nombre} · Rol: {usuario.rol}
        </p>
        <button type="button" onClick={() => void cerrarSesion()}>
          Cerrar sesión
        </button>
      </header>

      {jugadorSeleccionado ? (
        <section>
          <button
            type="button"
            onClick={() => setJugadorSeleccionado(null)}
          >
            Volver a jugadores
          </button>

          <h2>{jugadorSeleccionado.name}</h2>
          {jugadorSeleccionado.foto && (
            <img
              src={jugadorSeleccionado.foto}
              alt={`Foto de ${jugadorSeleccionado.name}`}
              width="120"
            />
          )}
          <p>Dorsal: {jugadorSeleccionado.dorsal}</p>
          <p>Posición: {jugadorSeleccionado.posicion}</p>
          <p>Nacionalidad: {jugadorSeleccionado.nacionalidad}</p>
          <p>
            Nacimiento:{" "}
            {new Date(jugadorSeleccionado.nacimiento).toLocaleDateString(
              "es-ES",
            )}
          </p>
          <p>
            Estado:{" "}
            {jugadorSeleccionado.retirado ? "Retirado" : "En activo"}
          </p>

          <h3>Trayectoria</h3>
          {jugadorSeleccionado.carrera.length ? (
            <ul>
              {jugadorSeleccionado.carrera.map((equipo, indice) => (
                <li key={`${equipo.equipo}-${equipo.anio}-${indice}`}>
                  {equipo.equipo} · {equipo.anio}
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay trayectoria registrada.</p>
          )}
        </section>
      ) : (
        <section>
          <h2>Jugadores</h2>

          <label>
            Buscar por nombre{" "}
            <input
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Ejemplo: Pedri"
            />
          </label>

          {cargando && <p>Cargando…</p>}

          <ul>
            {jugadores.map((jugador) => (
              <li key={jugador._id}>
                <button
                  type="button"
                  onClick={() => void abrirFicha(jugador._id)}
                >
                  {jugador.name} · Dorsal {jugador.dorsal} ·{" "}
                  {jugador.posicion}
                </button>
              </li>
            ))}
          </ul>

          {!cargando && jugadores.length === 0 && (
            <p>No hay jugadores con ese nombre.</p>
          )}
        </section>
      )}

      {error && <p role="alert">{error}</p>}
    </main>
  );
}