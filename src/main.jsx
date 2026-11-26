import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { ServiciosProvider, mensajeError, useServicios } from "./servicios.jsx";
import "./style.css";

const estados = ["Pendiente", "En proceso", "Finalizada"];
const siguiente = { Pendiente: "En proceso", "En proceso": "Finalizada" };

function Estado({ value }) {
  return (
    <span className={`estado estado-${estados.indexOf(value)}`}>{value}</span>
  );
}

function useGuardado() {
  const { guardar } = useServicios();
  const [respuesta, setRespuesta] = useState({
    ocupado: false,
    error: "",
    exito: "",
  });

  async function enviar(ruta, datos, mensaje, metodo) {
    setRespuesta({ ocupado: true, error: "", exito: "" });
    try {
      await guardar(ruta, datos, metodo);
      setRespuesta({ ocupado: false, error: "", exito: mensaje });
      return true;
    } catch (error) {
      setRespuesta({ ocupado: false, error: mensajeError(error), exito: "" });
      return false;
    }
  }
  return { ...respuesta, enviar };
}

function Aviso({ error, exito }) {
  return (
    <>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <p role="status" className="exito">
        {exito}
      </p>
    </>
  );
}

function Tabla({ columnas, filas, vacio }) {
  if (!filas.length) return <p className="vacio">{vacio}</p>;
  return (
    <div className="tabla">
      <table>
        <thead>
          <tr>
            {columnas.map((columna) => (
              <th scope="col" key={columna}>
                {columna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map(({ id, celdas }) => (
            <tr key={id}>
              {celdas.map((celda, index) => (
                <td key={columnas[index]}>{celda}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Selector({
  label,
  value,
  onChange,
  options,
  required = true,
  placeholder = "Seleccionar",
}) {
  return (
    <label>
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map(({ id, nombre }) => (
          <option value={id} key={id}>
            {nombre}
          </option>
        ))}
      </select>
    </label>
  );
}

function Inicio() {
  const { datos, perfil } = useServicios();
  return (
    <>
      <header>
        <h1>Panel de servicios</h1>
        <p>Consulta el avance de las solicitudes de atención técnica.</p>
      </header>
      <div className="resumen">
        {estados.map((estado) => (
          <article key={estado}>
            <Estado value={estado} />
            <strong>
              {
                datos.solicitudes.filter((item) => item.estado === estado)
                  .length
              }
            </strong>
          </article>
        ))}
      </div>
      <section>
        <h2>Solicitudes recientes</h2>
        <Tabla
          columnas={["Solicitud", "Cliente", "Servicio", "Estado"]}
          vacio="Todavía no hay solicitudes."
          filas={datos.solicitudes
            .slice(0, 5)
            .map((s) => ({
              id: s.id,
              celdas: [
                `#${s.id}`,
                s.cliente,
                s.descripcion,
                <Estado value={s.estado} />,
              ],
            }))}
        />
        <Link className="enlace" to="/solicitudes">
          {perfil === "administracion"
            ? "Gestionar solicitudes"
            : "Ver solicitudes"}
        </Link>
      </section>
    </>
  );
}

function Clientes() {
  const { datos } = useServicios();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const action = useGuardado();
  async function registrar(event) {
    event.preventDefault();
    if (
      await action.enviar(
        "/clientes",
        { nombre, telefono },
        "Cliente registrado.",
      )
    ) {
      setNombre("");
      setTelefono("");
    }
  }
  return (
    <>
      <header>
        <h1>Clientes</h1>
        <p>Registra los datos de contacto para asociarlos a una solicitud.</p>
      </header>
      <section>
        <h2>Registrar cliente</h2>
        <form onSubmit={registrar}>
          <div className="campos">
            <label>
              Nombre
              <input
                required
                minLength={2}
                maxLength={100}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </label>
            <label>
              Teléfono
              <input
                required
                type="tel"
                minLength={7}
                maxLength={22}
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </label>
          </div>
          <button disabled={action.ocupado}>Guardar cliente</button>
        </form>
        <Aviso {...action} />
      </section>
      <section>
        <h2>Clientes registrados</h2>
        <Tabla
          columnas={["Cliente", "Teléfono"]}
          vacio="Todavía no hay clientes."
          filas={datos.clientes.map((c) => ({
            id: c.id,
            celdas: [c.nombre, c.telefono],
          }))}
        />
      </section>
    </>
  );
}

function Solicitudes() {
  const { datos, perfil } = useServicios();
  const [cliente, setCliente] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [filtro, setFiltro] = useState("");
  const action = useGuardado();
  async function registrar(event) {
    event.preventDefault();
    if (
      await action.enviar(
        "/solicitudes",
        { cliente_id: Number(cliente), descripcion },
        "Solicitud registrada.",
      )
    ) {
      setCliente("");
      setDescripcion("");
    }
  }
  return (
    <>
      <header>
        <h1>Solicitudes</h1>
        <p>Consulta los servicios solicitados y su estado.</p>
      </header>
      {perfil === "administracion" && (
        <section>
          <h2>Nueva solicitud</h2>
          {datos.clientes.length ? (
            <form onSubmit={registrar}>
              <Selector
                label="Cliente"
                value={cliente}
                onChange={setCliente}
                options={datos.clientes}
              />
              <label>
                Descripción del servicio
                <textarea
                  required
                  minLength={5}
                  maxLength={500}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </label>
              <button disabled={action.ocupado}>Registrar solicitud</button>
            </form>
          ) : (
            <Link to="/clientes">Registra un cliente para continuar</Link>
          )}
          <Aviso {...action} />
        </section>
      )}
      <section>
        <div className="fila">
          <h2>Seguimiento</h2>
          <Selector
            label="Estado"
            value={filtro}
            onChange={setFiltro}
            required={false}
            placeholder="Todos"
            options={estados.map((estado) => ({ id: estado, nombre: estado }))}
          />
        </div>
        <Tabla
          columnas={["Solicitud", "Cliente", "Servicio", "Estado"]}
          vacio="No hay solicitudes para mostrar."
          filas={datos.solicitudes
            .filter((s) => !filtro || s.estado === filtro)
            .map((s) => ({
              id: s.id,
              celdas: [
                `#${s.id}`,
                s.cliente,
                s.descripcion,
                <Estado value={s.estado} />,
              ],
            }))}
        />
      </section>
    </>
  );
}

function Ordenes() {
  const { datos, perfil } = useServicios();
  const [solicitud, setSolicitud] = useState("");
  const [tecnico, setTecnico] = useState("");
  const [seleccion, setSeleccion] = useState("");
  const action = useGuardado();
  const admin = perfil === "administracion";
  const disponibles = datos.solicitudes.filter((s) => !s.orden_id);
  async function asignar(event) {
    event.preventDefault();
    if (
      await action.enviar(
        "/ordenes",
        { solicitud_id: Number(solicitud), tecnico_id: Number(tecnico) },
        "Orden asignada.",
      )
    ) {
      setSolicitud("");
      setTecnico("");
    }
  }
  const ordenes = admin
    ? datos.ordenes
    : datos.ordenes.filter((o) => o.tecnico_id === Number(seleccion));
  return (
    <>
      <header>
        <h1>Órdenes de trabajo</h1>
        <p>
          {admin
            ? "Asigna una solicitud a un técnico y consulta sus órdenes."
            : "Selecciona un técnico para consultar y actualizar sus órdenes."}
        </p>
      </header>
      {admin && (
        <section>
          <h2>Asignar orden</h2>
          {disponibles.length ? (
            <form onSubmit={asignar}>
              <div className="campos">
                <Selector
                  label="Solicitud"
                  value={solicitud}
                  onChange={setSolicitud}
                  options={disponibles.map((s) => ({
                    id: s.id,
                    nombre: `#${s.id} · ${s.cliente} · ${s.descripcion.slice(0, 50)}`,
                  }))}
                />
                <Selector
                  label="Técnico"
                  value={tecnico}
                  onChange={setTecnico}
                  options={datos.tecnicos}
                />
              </div>
              <button disabled={action.ocupado}>Asignar orden</button>
            </form>
          ) : (
            <p className="vacio">
              No hay solicitudes pendientes de asignación.
            </p>
          )}
        </section>
      )}
      <section>
        <div className="fila">
          <h2>{admin ? "Órdenes asignadas" : "Órdenes del técnico"}</h2>
          {!admin && (
            <Selector
              label="Técnico"
              value={seleccion}
              onChange={setSeleccion}
              options={datos.tecnicos}
              required={false}
            />
          )}
        </div>
        <Aviso {...action} />
        <Tabla
          columnas={
            admin
              ? ["Orden", "Solicitud", "Técnico", "Estado"]
              : ["Orden", "Servicio", "Estado", "Acción"]
          }
          vacio={
            !admin && !seleccion
              ? "Selecciona un técnico para ver sus órdenes."
              : "No hay órdenes para mostrar."
          }
          filas={ordenes.map((o) => ({
            id: o.id,
            celdas: admin
              ? [
                  `#${o.id}`,
                  `#${o.solicitud_id} · ${o.descripcion}`,
                  o.tecnico,
                  <Estado value={o.estado} />,
                ]
              : [
                  `#${o.id}`,
                  o.descripcion,
                  <Estado value={o.estado} />,
                  siguiente[o.estado] ? (
                    <button
                      disabled={action.ocupado}
                      onClick={() =>
                        action.enviar(
                          `/ordenes/${o.id}`,
                          { estado: siguiente[o.estado] },
                          "Estado actualizado.",
                          "patch",
                        )
                      }
                    >
                      {o.estado === "Pendiente" ? "Iniciar" : "Finalizar"}
                    </button>
                  ) : (
                    "Cerrada"
                  ),
                ],
          }))}
        />
      </section>
    </>
  );
}

function Aplicacion() {
  const { datos, cargando, error, recargar, perfil, setPerfil } =
    useServicios();
  const admin = perfil === "administracion";
  return (
    <div className="app">
      <aside>
        <Link to="/" className="marca">
          ServiRed
        </Link>
        <nav aria-label="Menú principal">
          <NavLink to="/" end>
            Panel
          </NavLink>
          {admin && <NavLink to="/clientes">Clientes</NavLink>}
          <NavLink to="/solicitudes">Solicitudes</NavLink>
          {perfil !== "consulta" && <NavLink to="/ordenes">Órdenes</NavLink>}
        </nav>
        <label>
          Vista de demostración
          <select
            aria-label="Vista de demostración"
            value={perfil}
            onChange={(e) => setPerfil(e.target.value)}
          >
            <option value="administracion">Administración</option>
            <option value="tecnico">Técnico</option>
            <option value="consulta">Consulta</option>
          </select>
        </label>
        <a className="api" href="/api-docs/">
          Documentación API ↗
        </a>
      </aside>
      <main>
        {cargando && <p role="status">Cargando información…</p>}
        {error && (
          <p role="alert" className="error">
            {error} <button onClick={recargar}>Reintentar</button>
          </p>
        )}
        {datos && (
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route
              path="/clientes"
              element={admin ? <Clientes /> : <Navigate to="/" replace />}
            />
            <Route path="/solicitudes" element={<Solicitudes />} />
            <Route
              path="/ordenes"
              element={
                perfil !== "consulta" ? (
                  <Ordenes key={perfil} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="*"
              element={
                <section>
                  <h1>Página no encontrada</h1>
                  <Link to="/">Volver al panel</Link>
                </section>
              }
            />
          </Routes>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ServiciosProvider>
      <Aplicacion />
    </ServiciosProvider>
  </BrowserRouter>,
);
