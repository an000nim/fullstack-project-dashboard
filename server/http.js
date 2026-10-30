export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
}

export function parseId(raw) {
  if (typeof raw !== "string" && typeof raw !== "number") {
    throw new HttpError(400, "Некорректный идентификатор.");
  }
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new HttpError(400, "Некорректный идентификатор.");
  }
  return id;
}

export function parsePage(query) {
  if (
    [query.limit, query.offset].some(
      (value) => value !== undefined && typeof value !== "string",
    )
  ) {
    throw new HttpError(400, "limit и offset должны быть отдельными числами.");
  }
  const limit = query.limit === undefined ? 25 : Number(query.limit);
  const offset = query.offset === undefined ? 0 : Number(query.offset);
  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !Number.isSafeInteger(offset) ||
    offset < 0
  ) {
    throw new HttpError(
      400,
      "limit должен быть от 1 до 100, offset — неотрицательным целым числом.",
    );
  }
  return { limit, offset };
}

function requiredString(value, field, maxLength) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.trim().length > maxLength
  ) {
    throw new HttpError(
      400,
      `${field}: укажите текст длиной от 1 до ${maxLength} символов.`,
    );
  }
  return value.trim();
}

function nonnegativeDecimal(value, field, max) {
  const number = Number(value);
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    value === "" ||
    value === null ||
    value === undefined ||
    !Number.isFinite(number) ||
    number < 0 ||
    number > max ||
    !/^\d+(?:\.\d{1,2})?$/.test(String(value))
  ) {
    throw new HttpError(
      400,
      `${field}: укажите неотрицательное число с точностью до двух знаков.`,
    );
  }
  return number;
}

function dateOnly(value, field) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, `${field}: укажите дату в формате ГГГГ-ММ-ДД.`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() < 1 ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new HttpError(400, `${field}: укажите существующую дату.`);
  }
  return value;
}

function priority(value) {
  const number = Number(value);
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    !Number.isInteger(number) ||
    number < 1 ||
    number > 5
  ) {
    throw new HttpError(400, "Приоритет должен быть целым числом от 1 до 5.");
  }
  return number;
}

export function validateProject(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Ожидается объект проекта.");
  }
  return {
    name: requiredString(body.name, "Название", 120),
    budget: nonnegativeDecimal(body.budget, "Бюджет", 9999999999.99),
    startDate: dateOnly(body.startDate, "Дата начала"),
    priority: priority(body.priority),
  };
}

export function validateTask(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Ожидается объект задачи.");
  }
  return {
    projectId: parseId(body.projectId),
    title: requiredString(body.title, "Название", 160),
    estimateHours: nonnegativeDecimal(
      body.estimateHours,
      "Оценка времени",
      999999.99,
    ),
    dueDate: dateOnly(body.dueDate, "Срок выполнения"),
    priority: priority(body.priority),
  };
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }
  if (error.code === "23503") {
    return res.status(409).json({
      error: "Связанная запись не найдена или препятствует удалению.",
    });
  }
  if (
    error.code === "23514" ||
    error.code === "22003" ||
    error.code === "22001"
  ) {
    return res
      .status(400)
      .json({ error: "Данные не соответствуют ограничениям базы." });
  }
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Некорректный JSON." });
  }
  if (error.type === "entity.too.large") {
    return res
      .status(413)
      .json({ error: "Размер запроса превышает допустимый." });
  }
  console.error(error);
  return res.status(500).json({ error: "Внутренняя ошибка сервера." });
}
