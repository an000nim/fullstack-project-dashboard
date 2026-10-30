import { app } from "./app.js";
import { db, closeDb } from "./db.js";

const port = Number(process.env.PORT || 3001);

try {
  await db.one("SELECT 1");
  const server = app.listen(port, () => {
    console.log(`API запущен на http://localhost:${port}`);
  });
  server.once("error", async (error) => {
    console.error(
      error.code === "EADDRINUSE"
        ? `Порт ${port} уже занят. Остановите ранее запущенный сервер сочетанием Control + C в его терминале и повторите запуск.`
        : `Не удалось запустить API: ${error.message}`,
    );
    await closeDb();
    process.exitCode = 1;
  });

  async function shutdown() {
    server.close(async () => {
      await closeDb();
      process.exit(0);
    });
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
} catch (error) {
  console.error("Не удалось подключиться к PostgreSQL:", error.message);
  await closeDb();
  process.exitCode = 1;
}
