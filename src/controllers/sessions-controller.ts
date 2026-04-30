import { AppError } from '@/utils/AppError';
import { Request, Response } from 'express';
import { authConfig } from '@/config/auth';
import { prisma } from '@/database/prisma';
import { sign } from 'jsonwebtoken';
import { compare } from 'bcryptjs';
import { z } from 'zod';

class SessionsController {
    async create(req: Request, res: Response) {

        const bodySchema = z.object({
            email: z.email(),
            password: z.string().min(6).max(64)
        });

        const { email, password } = bodySchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            throw new AppError('Invalid email or password', 401);
        }

        const passwordMatch = await compare(password, user.password);

        if (!passwordMatch) {
            throw new AppError('Invalid email or password', 401);
        }

        const { secret, expiresIn } = authConfig.jwt;

        const token = sign({ role: user.role ?? 'MEMBER' }, secret, { 
            subject: user.id,
            expiresIn 
        });

        const { password: hashedPassword, ...userWithoutPassword } = user
        
        return res.status(200).json({ token, user: userWithoutPassword });
    }
}

export { SessionsController };