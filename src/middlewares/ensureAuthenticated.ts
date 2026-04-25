import { Request, Response, NextFunction } from 'express'
import { verify } from 'jsonwebtoken'

import { authConfig } from '@/config/auth'
import { AppError } from '@/utils/AppError'

interface TokenPayload {
    sub: string
    role: string
}

function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization
        
        if (!authHeader) {
            throw new AppError('JWT token not Found', 401);
        }

        const [, token] = authHeader.split(' ')

        const { role, sub: user_Id } = verify(token, authConfig.jwt.secret) as TokenPayload
         
        req.user = {
            id: user_Id,
            role
        }

        return next()
    } catch (error) {
        throw new AppError('Invalid JWT token', 401);
    }
}

export { ensureAuthenticated };