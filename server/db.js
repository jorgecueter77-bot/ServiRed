import { DatabaseSync } from "node:sqlite";

// La solicitud toma su estado de la orden asociada.
export function openDatabase(path = ":memory:") {
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, telefono TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tecnicos (
      id INTEGER PRIMARY KEY, nombre TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS solicitudes (
      id INTEGER PRIMARY KEY, cliente_id INTEGER NOT NULL REFERENCES clientes(id),
      descripcion TEXT NOT NULL, creada TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS ordenes (
      id INTEGER PRIMARY KEY, solicitud_id INTEGER NOT NULL UNIQUE REFERENCES solicitudes(id),
      tecnico_id INTEGER NOT NULL REFERENCES tecnicos(id),
      estado TEXT NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','En proceso','Finalizada'))
    );
    INSERT OR IGNORE INTO tecnicos VALUES (1, 'Laura Méndez'), (2, 'Daniel Ruiz');
  `);
  return db;
}
