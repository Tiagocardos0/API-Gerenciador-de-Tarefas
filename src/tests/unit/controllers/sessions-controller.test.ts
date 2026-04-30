import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/database/prisma";

interface CreateUserPayload {
  name?: string;
  email?: string;
  password?: string;
}

describe("SessionsController", () => {
  const makeUser = (overrides: CreateUserPayload = {}) => ({
    name: "Test User",
    email: "test@example.com",
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

  describe("POST /sessions", () => {
    it("Deve autenticar um usuário com sucesso", async () => {
      const userData = makeUser();

      await request(app).post("/users").send(userData);

      const response = await request(app).post("/sessions").send({
        email: userData.email,
        password: userData.password,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(typeof response.body.token).toBe("string");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user).toHaveProperty("name");
      expect(response.body.user).toHaveProperty("email");
      expect(response.body.user).not.toHaveProperty("password");
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.email).toBe(userData.email);
    });

    it("Deve falhar com email inválido", async () => {
      const userData = makeUser();
      await request(app).post("/users").send(userData);

      const response = await request(app).post("/sessions").send({
        email: "invalid-email",
        password: userData.password,
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
    });

    it("Deve falhar com senha incorreta", async () => {
      const userData = makeUser();
      await request(app).post("/users").send(userData);

      const response = await request(app).post("/sessions").send({
        email: userData.email,
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
    });

    it("Deve falhar com email não cadastrado", async () => {
      const response = await request(app).post("/sessions").send({
        email: "naoexiste@email.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
    });
  });

  describe("Validações de campo", () => {
    it("Deve falhar se o email não for fornecido", async () => {
      const response = await request(app).post("/sessions").send({
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
    });

    it("Deve falhar se a senha não for fornecida", async () => {
      const response = await request(app).post("/sessions").send({
        email: "test@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
    });
  });
});
