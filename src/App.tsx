import { useState } from "react";
import type { FormEvent } from "react";

const API = import.meta.env.VITE_API_URL;

interface Jugador {
  _id: string;
  name: string;
  dorsal: number;
  posicion: string;
}

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
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

      setNombre(datos.usuario.nombre);
      setPassword("");

      const listado = await fetch(`${API}/jugadores`);

      if (!listado.ok) {
        throw new Error("No se pudieron cargar los jugadores.");
      }

      const pagina = await listado.json();
      setJugadores(pagina.results);
    } catch (fallo) {
      setError(
        fallo instanceof Error ? fallo.message : "Ha ocurrido un error.",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main>
      {nombre ? (
        <>
          <h1>Hola, {nombre}</h1>

          <a
            href="/"
            onClick={(evento) => {
              evento.preventDefault();
              setNombre("");
              setJugadores([]);
              setEmail("");
              setPassword("");
              setError("");
            }}
          >
            Cerrar sesión
          </a>

          <h2>Jugadores</h2>
          {!cargando && !error && jugadores.length === 0 && (
            <p>No hay jugadores registrados.</p>
          )}
          <ul>
            {jugadores.map((jugador) => (
              <li key={jugador._id}>
                {jugador.name} · Dorsal {jugador.dorsal} · {jugador.posicion}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <form onSubmit={iniciarSesion}>
          <h1>Iniciar sesión</h1>
          <p>
            <label>
              Correo{" "}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
          </p>
          <button disabled={cargando}>Entrar</button>
        </form>
      )}

      {cargando && <p>Cargando…</p>}
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
