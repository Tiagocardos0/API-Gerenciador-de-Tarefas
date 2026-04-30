import { Request, Response } from "express";
import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import { z } from "zod";

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

    return res.status(201).json({ task });
  }

  async index(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const querySchema = z.object({
      status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    });

    const { status, priority } = querySchema.parse(req.query);

    const isAdmin = req.user.role === "ADMIN";

    const tasks = await prisma.task.findMany({
      where: {
        ...(isAdmin ? {} : { assignedUserId: req.user.id }),
        status,
        priority,
      },
    });

    return res.status(200).json({ tasks });
  }

  async history(req: Request, res: Response) {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const paramsSchema = z.object({
      id: z.uuid(),
    });

    const { id } = paramsSchema.parse(req.params);

    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) throw new AppError("Task not found", 404);

    if (req.user.role === "MEMBER" && task.assignedUserId !== req.user.id) {
      throw new AppError("Not allowed", 403);
    }

    const history = await prisma.taskHistory.findMany({
      where: { taskId: id },
      orderBy: { changedAt: "desc" },
    });

    return res.status(200).json({ history });
  }

  async update(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const paramsSchema = z.object({
      id: z.uuid(),
    });

    const bodySchema = z
      .object({
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

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    if (req.user.role === "MEMBER" && task.assignedUserId !== req.user.id) {
      throw new AppError("Not allowed", 403);
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data,
    });

    if (data.status && task.status !== data.status) {
      await prisma.taskHistory.create({
        data: {
          taskId: task.id,
          changedById: req.user.id,
          oldStatus: task.status,
          newStatus: data.status,
        },
      });
    }

    return res.status(200).json({ task: updatedTask });
  }

  async delete(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const paramsSchema = z.object({
      id: z.uuid(),
    });

    const { id } = paramsSchema.parse(req.params);

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    if (req.user.role === "MEMBER" && task.assignedUserId !== req.user.id) {
      throw new AppError("Not allowed", 403);
    }

    await prisma.task.delete({
      where: { id },
    });

    return res.status(204).json();
  }
}

export { TaskController };
