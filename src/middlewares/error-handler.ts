import { Request, Response, NextFunction } from "express";
import { AppError } from "@/utils/AppError";
import { ZodError } from "zod";

function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: "error",
      message: error.message
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      status: "error",
      message: "Erro de validação",
      issues: error.issues
    });
  }

  console.error(error);

  return res.status(500).json({
    status: "error",
    message: "Erro interno do servidor"
  });
}

export { errorHandler };