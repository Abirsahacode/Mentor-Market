import crypto from "node:crypto";

export const requestId = (req, res, next) => {
  req.requestId = req.get("X-Request-ID") || crypto.randomUUID();
  res.set("X-Request-ID", req.requestId);
  next();
};

export const notFound = (req, res) => {
  res.status(404).json({
    error: {
      code: "route_not_found",
      message: `Route ${req.method} ${req.originalUrl} was not found`,
      request_id: req.requestId,
    },
  });
};

export const errorHandler = (err, req, res, _next) => {
  const status = err.status || (err.code === "ER_DUP_ENTRY" ? 409 : 500);
  const code = err.code === "ER_DUP_ENTRY" ? "duplicate_resource" : err.code || "internal_error";
  const message = status === 500 && process.env.NODE_ENV === "production"
    ? "An unexpected error occurred"
    : err.message || "An unexpected error occurred";

  res.status(status).json({
    error: {
      code,
      message,
      ...(err.details ? { details: err.details } : {}),
      request_id: req.requestId,
    },
  });
};

