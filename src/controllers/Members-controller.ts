import { Response, Request } from "express";
import { prisma } from "@/database/prisma";
import { z } from "zod";
import { AppError } from "@/utils/AppError";

class MembersController {
  async create(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const bodySchema = z.object({
      userId: z.uuid(),
      teamId: z.uuid(),
    });

    const { userId, teamId } = bodySchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });

    if (!team) {
      throw new AppError("Team not found", 404);
    }

    const alreadyMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: { userId, teamId },
      },
    });

    if (alreadyMember) {
      throw new AppError("User is already a member of this team", 409);
    }

    await prisma.teamMember.create({
      data: { userId, teamId },
    });

    return res.status(201).json({ message: "Member added to team successfully" });
  }

  async show(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const paramsSchema = z.object({
      teamId: z.uuid(),
    });

    const { teamId } = paramsSchema.parse(req.params);

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        teamMembers: {
          select: {
            id: true,
            userId: true,
            teamId: true,
            createdAt: true,
          }
        }
      }
    });

    if (!team) {
      throw new AppError("Team not found", 404);
    }

    return res.status(200).json({ team });
  }

  async delete(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const paramsSchema = z.object({
      id: z.uuid(),
    });

    const { id } = paramsSchema.parse(req.params);

    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
    });

    if (!teamMember) {
      throw new AppError("Team member not found", 404);
    }

    await prisma.teamMember.delete({
      where: { id },
    });

    return res.status(200).json({ message: "Member removed from team successfully" });
  }
}

export { MembersController };
