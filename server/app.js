import express from "express";
import swaggerUi from "swagger-ui-express";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const spec = JSON.parse(
  readFileSync(new URL("./openapi.json", import.meta.url)),
);
const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const clean = (value) => (typeof value === "string" ? value.trim() : "");
const id = (value) => Number.isSafeInteger(value) && value > 0;

export function createApp(db) {
  const app = express();
  app.use(express.json({ limit: "16kb" }));
  const api = express.Router();
  app.use("/api", api);
  app.get("/openapi.json", (_req, res) => res.json(spec));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(spec));

  api.get("/clientes", (_req, res) =>
    res.json(db.prepare("SELECT * FROM clientes ORDER BY id DESC").all()),
  );
  api.get("/tecnicos", (_req, res) =>
    res.json(db.prepare("SELECT * FROM tecnicos ORDER BY nombre").all()),
  );
  api.get("/solicitudes", (_req, res) =>
    res.json(
      db
        .prepare(
          `
    SELECT s.*, c.nombre AS cliente, o.id AS orden_id, COALESCE(o.estado,'Pendiente') AS estado
    FROM solicitudes s JOIN clientes c ON c.id=s.cliente_id
    LEFT JOIN ordenes o ON o.solicitud_id=s.id ORDER BY s.id DESC
  `,
        )
        .all(),
    ),
  );
  api.get("/ordenes", (req, res) => {
    const technician = req.query.tecnico_id;
    if (technician !== undefined && !id(Number(technician))) {
      return res.status(400).json({ mensaje: "Técnico inválido." });
    }
    const query = `SELECT o.*, t.nombre AS tecnico, s.descripcion, c.nombre AS cliente
      FROM ordenes o JOIN tecnicos t ON t.id=o.tecnico_id
      JOIN solicitudes s ON s.id=o.solicitud_id JOIN clientes c ON c.id=s.cliente_id
      WHERE (? IS NULL OR o.tecnico_id=?) ORDER BY o.id DESC`;
    const filter = technician === undefined ? null : Number(technician);
    res.json(db.prepare(query).all(filter, filter));
  });

  api.post("/clientes", (req, res) => {
    const nombre = clean(req.body?.nombre);
    const telefono = clean(req.body?.telefono);
    if (
      nombre.length < 2 ||
      nombre.length > 100 ||
      !/^[+0-9 ()-]{7,22}$/.test(telefono) ||
      telefono.replace(/\D/g, "").length < 7
    ) {
      return res
        .status(400)
        .json({ mensaje: "Escribe un nombre y un teléfono válido." });
    }
    const result = db
      .prepare("INSERT INTO clientes(nombre, telefono) VALUES (?, ?)")
      .run(nombre, telefono);
    res
      .status(201)
      .json({ id: Number(result.lastInsertRowid), nombre, telefono });
  });
  api.post("/solicitudes", (req, res) => {
    const cliente = req.body?.cliente_id;
    const descripcion = clean(req.body?.descripcion);
    if (!id(cliente) || descripcion.length < 5 || descripcion.length > 500) {
      return res
        .status(400)
        .json({
          mensaje:
            "Selecciona un cliente y describe el servicio en 5 a 500 caracteres.",
        });
    }
    if (!db.prepare("SELECT id FROM clientes WHERE id=?").get(cliente)) {
      return res.status(404).json({ mensaje: "El cliente no existe." });
    }
    const result = db
      .prepare("INSERT INTO solicitudes(cliente_id, descripcion) VALUES (?, ?)")
      .run(cliente, descripcion);
    res
      .status(201)
      .json({
        id: Number(result.lastInsertRowid),
        cliente_id: cliente,
        descripcion,
        estado: "Pendiente",
      });
  });
  api.post("/ordenes", (req, res) => {
    const solicitud = req.body?.solicitud_id;
    const tecnico = req.body?.tecnico_id;
    if (!id(solicitud) || !id(tecnico)) {
      return res
        .status(400)
        .json({ mensaje: "Selecciona una solicitud y un técnico." });
    }
    if (
      !db.prepare("SELECT id FROM solicitudes WHERE id=?").get(solicitud) ||
      !db.prepare("SELECT id FROM tecnicos WHERE id=?").get(tecnico)
    ) {
      return res
        .status(404)
        .json({ mensaje: "La solicitud o el técnico no existe." });
    }
    const result = db
      .prepare(
        `
      INSERT INTO ordenes(solicitud_id, tecnico_id) VALUES (?, ?)
      ON CONFLICT(solicitud_id) DO NOTHING
    `,
      )
      .run(solicitud, tecnico);
    if (!result.changes)
      return res
        .status(409)
        .json({ mensaje: "La solicitud ya tiene una orden." });
    res
      .status(201)
      .json({
        id: Number(result.lastInsertRowid),
        solicitud_id: solicitud,
        tecnico_id: tecnico,
        estado: "Pendiente",
      });
  });
  api.patch("/ordenes/:id", (req, res) => {
    const orderId = Number(req.params.id);
    const estado = req.body?.estado;
    if (!id(orderId) || !["En proceso", "Finalizada"].includes(estado)) {
      return res
        .status(400)
        .json({ mensaje: "Identificador o estado inválido." });
    }
    const previous = estado === "En proceso" ? "Pendiente" : "En proceso";
    const result = db
      .prepare("UPDATE ordenes SET estado=? WHERE id=? AND estado=?")
      .run(estado, orderId, previous);
    if (result.changes) return res.json({ id: orderId, estado });
    if (!db.prepare("SELECT id FROM ordenes WHERE id=?").get(orderId)) {
      return res.status(404).json({ mensaje: "La orden no existe." });
    }
    res
      .status(409)
      .json({
        mensaje:
          "Avanza la orden de Pendiente a En proceso y después a Finalizada.",
      });
  });
  api.use((_req, res) =>
    res.status(404).json({ mensaje: "Ruta de API no encontrada." }),
  );
  if (existsSync(dist)) {
    app.use(express.static(dist));
    app.get(/.*/, (_req, res) => res.sendFile("index.html", { root: dist }));
  }
  app.use((err, _req, res, _next) => {
    if (err.status === 400 || err.status === 413) {
      return res
        .status(err.status)
        .json({ mensaje: "El cuerpo de la petición no es válido." });
    }
    console.error(err);
    res.status(500).json({ mensaje: "No se pudo completar la operación." });
  });
  return app;
}
