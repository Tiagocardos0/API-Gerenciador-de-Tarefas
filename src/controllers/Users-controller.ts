import { Request, Response } from "express";
import { AppError } from "@/utils/AppError";
import { prisma } from "@/database/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

class UsersController {
    async create(req: Request, res: Response) {
        const bodySchema = z.object({
            name: z.string().min(2).max(100),
            email: z.string().email(),
            password: z.string().min(6).max(64)
        });

        const { name, email, password } = bodySchema.parse(req.body);

        const userWithSameEmail = await prisma.user.findUnique({ where: { email } });
        
        if (userWithSameEmail) {
            throw new AppError("User with this email already exists", 400);
        }
        
        const hashedPassword = await hash(password, 8);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        const { password: _, ...userWithoutPassword } = user;

        return res.status(201).json(userWithoutPassword);
    }
}

export { UsersController };