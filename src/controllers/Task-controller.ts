import { Request, Response } from "express";
import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import { z } from "zod";
import { TaskStatus, Priority } from "@prisma/client";

class TaskController {
  async create(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const bodySchema = z.object({
      title: z.string().trim().min(1).max(255),
      description: z.string().trim().max(1024).optional(),
      teamId: z.uuid(),
    });

    const { title, description, teamId } = bodySchema.parse(req.body);

    const userId = req.user.id;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        team: { connect: { id: teamId } },
        assignedUser: { connect: { id: userId } },
      },
    });

    return res.status(201).json({
      message: "Task created successfully",
      task,
    });
  }

  async show(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const tasks = await prisma.task.findMany({
      where: {
        assignedUserId: req.user.id,
      },
    });

    return res.status(200).json({
      message: "Tasks retrieved successfully",
      tasks,
    });
  }

  async update(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const paramsSchema = z.object({
      id: z.uuid(),
    });

    const bodySchema = z.object({
        title: z.string().trim().min(1).max(255).optional(),
        description: z.string().trim().max(1024).optional(),
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
      })
      .refine((data) => Object.values(data).some((v) => v !== undefined), {
        message:
          "Please provide at least one field to update: title, description, status, or priority.",
      });

    const { id } = paramsSchema.parse(req.params);
    const data = bodySchema.parse(req.body);

    const task = await prisma.task.update({
      where: { id },
      data,
    });

    return res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  }

  async delete(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const paramsSchema = z.object({
      id: z.uuid(),
    });

    const { id } = paramsSchema.parse(req.params);

    await prisma.task.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  }
}

export { TaskController };
