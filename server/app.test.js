import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createApp } from "./app.js";
import { openDatabase } from "./db.js";

let db, server, base;
before(async () => {
  db = openDatabase();
  server = createApp(db).listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
});

async function request(path, method = "GET", body) {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

test("registro, asignación, transición y consulta de estado", async () => {
  const cliente = await request("/api/clientes", "POST", {
    nombre: "Cliente Demo",
    telefono: "3000000001",
  });
  assert.equal(cliente.status, 201);
  const solicitud = await request("/api/solicitudes", "POST", {
    cliente_id: cliente.body.id,
    descripcion: "Revisar conexión",
  });
  assert.equal(solicitud.status, 201);
  const datos = { solicitud_id: solicitud.body.id, tecnico_id: 1 };
  const orden = await request("/api/ordenes", "POST", datos);
  assert.equal(orden.status, 201);
  assert.equal((await request("/api/ordenes", "POST", datos)).status, 409);
  assert.equal((await request("/api/ordenes?tecnico_id=2")).body.length, 0);
  const ruta = "/api/ordenes/" + orden.body.id;
  assert.equal(
    (await request(ruta, "PATCH", { estado: "Finalizada" })).status,
    409,
  );
  assert.equal(
    (await request(ruta, "PATCH", { estado: "En proceso" })).status,
    200,
  );
  assert.equal(
    (await request(ruta, "PATCH", { estado: "Finalizada" })).status,
    200,
  );
  assert.equal(
    (await request("/api/solicitudes")).body[0].estado,
    "Finalizada",
  );
});

test("campos inválidos y referencias inexistentes", async () => {
  assert.equal(
    (await request("/api/clientes", "POST", { nombre: "", telefono: "000" }))
      .status,
    400,
  );
  assert.equal(
    (
      await request("/api/solicitudes", "POST", {
        cliente_id: 999,
        descripcion: "Revisar conexión",
      })
    ).status,
    404,
  );
  assert.equal(
    (await request("/api/ordenes/999", "PATCH", { estado: "En proceso" }))
      .status,
    404,
  );
});

test("contrato OpenAPI y Swagger UI disponibles", async () => {
  const spec = await request("/openapi.json");
  assert.equal(spec.status, 200);
  assert.equal(spec.body.openapi, "3.0.3");
  const docs = await fetch(base + "/api-docs/");
  assert.equal(docs.status, 200);
  assert.match(await docs.text(), /Swagger UI/);
});
