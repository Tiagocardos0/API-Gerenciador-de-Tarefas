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
      description: z.string().max(1024).optional(),
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
}

export { TaskController };
