import request from "supertest";
import { prisma } from "@/database/prisma";
import { app } from "../../../app";
import { compare } from "bcryptjs";

interface UserPayload {
  name?: string;
  email?: string;
  password?: string;
}

describe("Integração - UsersController", () => {
  const makeUser = (overrides: UserPayload = {}) => ({
    name: "Test User",
    email: `test${Date.now()}@example.com`,
    password: "password123",
    ...overrides,
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await prisma.$executeRawUnsafe(`
  TRUNCATE TABLE 
    "public"."task_history",
    "public"."tasks",
    "public"."team_members",
    "public"."users"
  RESTART IDENTITY CASCADE;
`);
  });

  describe("POST /users", () => {
    it("Deve criar um novo usuário com sucesso", async () => {
      const userData = makeUser();
      const response = await request(app).post("/users").send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: userData.name,
        email: userData.email,
        role: "MEMBER",
      });

      expect(response.body).toHaveProperty("id");
      expect(response.body).not.toHaveProperty("password");
    });

    it("Deve retornar erro ao criar usuário com email já cadastrado", async () => {
      const userData = makeUser();
      await request(app).post("/users").send(userData);

      const response = await request(app).post("/users").send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toBe("User with this email already exists");
    });

    it("Deve falhar quando o email não for fornecido", async () => {
      const { email, ...userData } = makeUser();
      const response = await request(app).post("/users").send(userData);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
    });

    it("Deve salvar a senha criptografada no banco de dados", async () => {
      const userData = makeUser();
      await request(app).post("/users").send(userData);

      const userInDb = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(userInDb).not.toBeNull();
      expect(userInDb!.password).not.toBe(userData.password);
      expect(await compare(userData.password, userInDb!.password)).toBe(true);
    });

    it("Deve falhar se o body estiver vazio", async () => {
      const response = await request(app).post("/users").send({});
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
    });

    describe("Validações de campo", () => {
      it("Deve falhar se o nome for muito curto", async () => {
        const userData = makeUser({ name: "A" });
        const response = await request(app).post("/users").send(userData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
      });

      it("Deve retornar erro se a senha for muito curta", async () => {
        const userData = makeUser({ password: "123" });
        const response = await request(app).post("/users").send(userData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
      });

      it("Deve falhar se a senha for muito longa", async () => {
        const userData = makeUser({ password: "A".repeat(65) });
        const response = await request(app).post("/users").send(userData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
      });

      it("Deve falhar se o email for inválido", async () => {
        const userData = makeUser({ email: "invalid-email" });
        const response = await request(app).post("/users").send(userData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
      });
    });
  });
});
