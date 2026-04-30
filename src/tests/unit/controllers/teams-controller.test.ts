import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/database/prisma";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";

interface CreateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: "ADMIN" | "MEMBER";
}

describe("Teams Controller", () => {
  const makeUser = (overrides: CreateUserPayload = {}) => ({
    name: "Test-User",
    email: `test${Date.now()}@example.com`,
    password: "password123",
    role: "ADMIN",
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
    "public"."teams",
    "public"."team_members",
    "public"."users"
  RESTART IDENTITY CASCADE;
`);
  });

  let token: string;

  beforeEach(async () => {
    const userData = makeUser();

    await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: await hash(userData.password, 8),
        role: "ADMIN",
      },
    });

    const session = await request(app).post("/sessions").send({
      email: userData.email,
      password: userData.password,
    });

    token = session.body.token;
  });

  describe("POST /teams", () => {
    it("Deve criar uma nova equipe", async () => {
      const teamsData = {
        name: `Team-${Date.now()}`,
        description: "Description for Team A",
      };

      const response = await request(app)
        .post("/teams")
        .set("Authorization", `Bearer ${token}`)
        .send(teamsData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("team");
      expect(response.body.team).toHaveProperty("id");
      expect(response.body.team).toMatchObject({
        name: teamsData.name,
        description: teamsData.description,
      });
      expect(response.body).toHaveProperty(
        "message",
        "Team created successfully",
      );
    });

    describe("Validações de campo", () => {
      it("Deve retornar 400 quando o nome não for informado", async () => {
        const response = await request(app)
          .post("/teams")
          .set("Authorization", `Bearer ${token}`)
          .send({
            description: "Descrição do time sem nome",
          });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          status: "error",
          message: "Erro de validação",
        });
        expect(response.body).toHaveProperty("issues");
      });

      it("Deve retornar 400 quando o nome da equipe for muito curto", async () => {
        const response = await request(app)
          .post("/teams")
          .set("Authorization", `Bearer ${token}`)
          .send({
            name: "A",
            description: "Descrição do time com nome muito curto",
          });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          status: "error",
          message: "Erro de validação",
        });
        expect(response.body).toHaveProperty("issues");
      });

      it("Deve retornar 400 quando o nome da equipe for muito longo", async () => {
        const response = await request(app)
          .post("/teams")
          .set("Authorization", `Bearer ${token}`)
          .send({
            name: "A".repeat(101),
            description: "Descrição do time com nome muito longo",
          });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          status: "error",
          message: "Erro de validação",
        });
        expect(response.body).toHaveProperty("issues");
      });
    });
  });

  describe("GET /teams", () => {
    it("Deve retornar uma lista de equipes", async () => {
      // cria team no banco
      const team = await prisma.team.create({
        data: {
          name: `Team-${Date.now()}`,
          description: "Description for Team A",
        },
      });

      const response = await request(app)
        .get("/teams")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: team.id,
            name: team.name,
            description: team.description,
          }),
        ]),
      );
    });

    it("Deve retornar 401 quando não autenticado", async () => {
      const response = await request(app).get("/teams");

      expect(response.status).toBe(401);
    });

    it("Deve retornar 401 com token inválido", async () => {
      const response = await request(app)
        .get("/teams")
        .set("Authorization", "Bearer invalidtoken");

      expect(response.status).toBe(401);
    });

    it("Deve retornar 403 quando não for ADMIN", async () => {
      const userData = makeUser({ role: "MEMBER" });

      await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: await hash(userData.password, 8),
          role: "MEMBER",
        },
      });

      const session = await request(app).post("/sessions").send({
        email: userData.email,
        password: userData.password,
      });

      const token = session.body.token;

      const response = await request(app)
        .get("/teams")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    it("Deve retornar array vazio quando não houver equipes", async () => {
      const response = await request(app)
        .get("/teams")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toEqual([]);
    });
  });

  describe("PUT /teams/:id", () => {
    it("Deve atualizar uma equipe existente e retornar 200", async () => {
      const team = await prisma.team.create({
        data: {
          name: `Team-${Date.now()}`,
          description: "Description for Team A",
        },
      });

      const response = await request(app)
        .put(`/teams/${team.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Updated Team Name",
          description: "Updated description",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", team.id);
      expect(response.body.name).toBe("Updated Team Name");
      expect(response.body.description).toBe("Updated description");
    });

    it("Deve retornar 404 quando o time não existir", async () => {
      const response = await request(app)
        .put(`/teams/${randomUUID()}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Team Name" });

      expect(response.status).toBe(404);
    });

    it("Deve retornar 401 quando não autenticado", async () => {
      const response = await request(app)
        .put(`/teams/${randomUUID()}`)
        .send({ name: "Updated Team Name" });

      expect(response.status).toBe(401);
    });

    it("Deve retornar 400 quando o body estiver vazio", async () => {
      const team = await prisma.team.create({
        data: {
          name: `Team-${Date.now()}`,
          description: "Description for Team",
        },
      });

      const response = await request(app)
        .put(`/teams/${team.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it("Deve retornar 409 quando o nome já estiver em uso", async () => {
      const existingTeam = await prisma.team.create({
        data: { name: `Team-${Date.now()}`, description: "..." },
      });
      const teamToUpdate = await prisma.team.create({
        data: { name: `Team-${Date.now() + 1}`, description: "..." },
      });

      const response = await request(app)
        .put(`/teams/${teamToUpdate.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: existingTeam.name });

      expect(response.status).toBe(409);
    });

    describe("Validações de campo", () => {
      it("Deve retornar 400 quando o id não for um UUID válido", async () => {
        const response = await request(app)
          .put("/teams/invalid-uuid")
          .set("Authorization", `Bearer ${token}`)
          .send({
            name: "Updated Team Name",
          });

        expect(response.status).toBe(400);
      });

      it("Deve retornar 400 quando o nome for muito curto", async () => {
        const team = await prisma.team.create({
          data: {
            name: `Team-${Date.now()}`,
            description: "Description for Team A",
          },
        });

        const response = await request(app)
          .put(`/teams/${team.id}`)
          .set("Authorization", `Bearer ${token}`)
          .send({
            name: "A".repeat(1),
            description: "Updated description",
          });

        expect(response.status).toBe(400);
      });

      it("Deve retornar 400 quando o nome for muito longo", async () => {
        const team = await prisma.team.create({
          data: {
            name: `Team-${Date.now()}`,
            description: "Description for Team A",
          },
        });

        const response = await request(app)
          .put(`/teams/${team.id}`)
          .set("Authorization", `Bearer ${token}`)
          .send({
            name: "A".repeat(101),
            description: "Updated description",
          });

        expect(response.status).toBe(400);
      });
    });
  });

  describe("DELETE /teams/:id", () => {
    it("Deve deletar uma equipe existente e retornar 204", async () => {
      const team = await prisma.team.create({
        data: {
          name: `Team-${Date.now()}`,
          description: "Description for Team A",
        },
      });

      const response = await request(app)
        .delete(`/teams/${team.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it("Deve retornar 400 quando o id não for um UUID válido", async () => {
      const response = await request(app)
        .delete("/teams/invalid-uuid")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it("Deve retornar 404 quando o time não existir", async () => {
      const response = await request(app)
        .delete(`/teams/${randomUUID()}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it("Deve retornar 401 quando não autenticado", async () => {
      const response = await request(app).delete(`/teams/${randomUUID()}`);
      expect(response.status).toBe(401);
    });
  });
});
