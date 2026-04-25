import { Request, Response } from "express";

class UsersController {
    async create(req: Request, res: Response) {
        return res.status(201).json({ message: "User created" });
    }
}

export { UsersController };