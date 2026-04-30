import { Request, Response } from "express";
import { AppError } from "@/utils/AppError";
import { prisma } from "@/database/prisma";
import { z } from "zod";

class TeamsController {
  async create(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const userId = req.user.id;

    const bodySchema = z.object({
      name: z.string().min(2).max(100).trim(),
      description: z.string().max(255).optional(),
    });

    const { name, description } = bodySchema.parse(req.body);

    const team = await prisma.team.create({
      data: {
        name,
        description,
      },
    });

    await prisma.teamMember.create({
      data: {
        userId,
        teamId: team.id,
      },
    });

    return res.status(201).json({
      message: "Team created successfully",
      team,
    });
  }

  async show(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    return res.status(200).json(teams);
  }

  async update(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const paramsSchema = z.object({
      id: z.uuid(),
    });

    const { id: teamId } = paramsSchema.parse(req.params);

    const bodySchema = z.object({
      name: z.string().min(2).max(100).trim(),
      description: z.string().max(255).optional(),
    });

    const { name, description } = bodySchema.parse(req.body);

    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        name,
        ...(description !== undefined && { description }),
      },
    });

    return res.status(200).json(team);
  }

  async delete(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const paramsSchema = z.object({
      id: z.uuid(),
    });

    const { id: teamId } = paramsSchema.parse(req.params);

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new AppError("Team not found", 404);
    }

    await prisma.team.delete({
      where: { id: teamId },
    });

    return res.status(204).json();
  }
}

export { TeamsController };
