import { Response, Request } from "express";
import { prisma } from "@/database/prisma";
import { z } from "zod";
import th from "zod/v4/locales/th.js";
import { AppError } from "@/utils/AppError";

class MembersController {
  async create(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const bodySchema = z.object({
      userId: z.uuid(),
      teamId: z.uuid(),
    });

    const { userId, teamId } = bodySchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const alreadyMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: { userId, teamId },
      },
    });

    if (alreadyMember) {
      return res.status(409).json({ message: "User is already a member of this team" });
    }

    await prisma.teamMember.create({
      data: { userId, teamId },
    });

    return res.status(201).json({ message: "Member added to team successfully" });
  }

  async show(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
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
      return res.status(404).json({ message: "Team not found" });
    }

    return res.status(200).json({ team });
  }

  async delete(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const paramsSchema = z.object({
      id: z.uuid(),
    });

    const { id } = paramsSchema.parse(req.params);

    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
    });

    if (!teamMember) {
        return res.status(404).json({ message: "Team member not found" });
  }

    await prisma.teamMember.delete({
      where: { id },
    });

    return res.status(200).json({ message: "Member removed from team successfully" });
  }
}

export { MembersController };
