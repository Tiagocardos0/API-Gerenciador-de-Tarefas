import { Request, Response, NextFunction } from "express";
import { AppError } from "@/utils/AppError";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: "error",
      message: error.message,
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      status: "error",
      message: "Erro de validação",
      issues: error.issues,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return res.status(404).json({
        status: "error",
        message: "Registro não encontrado",
      });
    }
    if (error.code === "P2002") {
      return res.status(409).json({
        status: "error",
        message: "Registro já existe",
      });
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      status: "error",
      message: "Dados inválidos enviados ao banco",
    });
  }

  console.error(error);

  return res.status(500).json({
    status: "error",
    message: "Erro interno do servidor",
  });
}

export { errorHandler };
