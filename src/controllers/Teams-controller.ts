import { Request, Response } from "express";
import { AppError } from "@/utils/AppError";
import { prisma } from "@/database/prisma";
import { z } from "zod";

class TeamsController {
  async create(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Usuário não autenticado", 401);
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
}

export { TeamsController };
