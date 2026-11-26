import { createApp } from "./app.js";
import { openDatabase } from "./db.js";

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
const db = openDatabase(process.env.DB_PATH || "servired.sqlite");
createApp(db).listen(port, host, () =>
  console.log(`ServiRed disponible en http://${host}:${port}`),
);
