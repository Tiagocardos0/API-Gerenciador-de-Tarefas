import { Request, Response, NextFunction } from "express"
import { AppError } from "@/utils/AppError"

function verifyUserAuthorization(role: string[]) {
    return (request: Request, response: Response, next: NextFunction) => {
        if(!request.user || !role.includes(request.user.role )) {
            throw new AppError('Forbidden', 403)
        }

        
        return next()
    }
}
export { verifyUserAuthorization }