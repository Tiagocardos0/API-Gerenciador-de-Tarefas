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

describe("TaskController", () => {
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
  let userId: string;

  beforeEach(async () => {
    const userData = makeUser();

    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: await hash(userData.password, 8),
        role: "ADMIN",
      },
    });

    userId = user.id;

    const session = await request(app).post("/sessions").send({
      email: userData.email,
      password: userData.password,
    });

    token = session.body.token;
  });

  describe("POST /tasks", () => { 

    it("Deve criar uma tarefa com dados válidos", async () => {
      const team = await prisma.team.create({
        data: {
          name: `Test-${Date.now()}`,
        },
      });
      const response = await request(app)
        .post("/tasks")
        .set("Authorization", `Bearer ${token}`)

        .send({
          title: "Test Task",
          description: "This is a test task",
          teamId: team.id,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("task");
      expect(response.body.task).toMatchObject({
        title: "Test Task",
        description: "This is a test task",
        teamId: team.id,
      });
    });

    it("Deve retornar 404 quando o teamId não existir", async () => {
      const response = await request(app)
        .post("/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Valid Title",
          teamId: randomUUID(),
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message");
    });

    describe("validações de campos", () => {
      it("Deve retornar 400 quando o título estiver vazio", async () => {

        const team = await prisma.team.create({
          data: {
            name: `Test-${Date.now()}`,
          },
        });

        const response = await request(app)
          .post("/tasks")
          .set("Authorization", `Bearer ${token}`)
          .send({
            title: "",
            teamId: team.id,
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
      });

      it("Deve retornar 400 quando o título exceder 255 caracteres", async () => {
        const team = await prisma.team.create({
          data: {
            name: `Test-${Date.now()}`,
          },
        });

        const response = await request(app)
          .post("/tasks")
          .set("Authorization", `Bearer ${token}`)
          .send({
            title: "a".repeat(256),
            teamId: team.id,
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
      });

      it("Deve retornar 400 quando a descrição exceder 1024 caracteres", async () => {
        const team = await prisma.team.create({
          data: {
            name: `Test-${Date.now()}`,
          },
        });

        const response = await request(app)
          .post("/tasks")
          .set("Authorization", `Bearer ${token}`)
          .send({
            title: "Valid Title",
            description: "a".repeat(1025),
            teamId: team.id,
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
      });

      it("Deve retornar 400 quando teamId não for um UUID válido", async () => {
        const response = await request(app)
          .post("/tasks")
          .set("Authorization", `Bearer ${token}`)
          .send({
            title: "Valid Title",
            teamId: "invalid-uuid",
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
      });
    });
  });

  describe("GET /tasks", () => {

    it("Deve listar as tarefas do usuário autenticado", async () => {
      const team = await prisma.team.create({
        data: {
          name: `Test-${Date.now()}`,
        },
      });

      const task = await prisma.task.create({
        data: {
          title: "Task 1",
          teamId: team.id,
          assignedUserId: userId,
        },
      });

      const response = await request(app)
        .get("/tasks")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("tasks");
      expect(response.body.tasks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: task.id,
            title: "Task 1",
            teamId: team.id,
          }),
        ])
      );
    });

    it("Deve retornar 401 quando não autenticado", async () => {
      const response = await request(app).get("/tasks");
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
    });

    it("Deve retornar array vazio quando não houver tarefas", async () => {
      const response = await request(app)
        .get("/tasks")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.tasks).toEqual([]);
    });

    describe("validações de query", () => {
      it("Deve retornar 400 para status inválido", async () => {
        const response = await request(app)
          .get("/tasks")
          .set("Authorization", `Bearer ${token}`)
          .query({ status: "INVALID_STATUS" });


        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
      });

      it("Deve retornar 400 para prioridade inválida", async () => {
        const response = await request(app)
          .get("/tasks")
          .set("Authorization", `Bearer ${token}`)
          .query({ priority: "INVALID_PRIORITY" });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
      });
    });
  });

  describe("GET /tasks/:id/history", () => {

    it("Deve retornar 401 quando não autenticado", async () => {
      const response = await request(app)
        .get(`/tasks/${randomUUID()}/history`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
    });

    it("Deve retornar o histórico de uma tarefa existente", async () => {
      const team = await prisma.team.create({
        data: {
          name: `Test-${Date.now()}`,
        },
      });

      const task = await prisma.task.create({
        data: {
          title: "Task with History",
          teamId: team.id,
          assignedUserId: userId,
        },
      });

      const response = await request(app)
        .get(`/tasks/${task.id}/history`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("history");
      expect(Array.isArray(response.body.history)).toBe(true);
    });

    it("Deve retornar 404 para tarefa inexistente", async () => {
      const response = await request(app)
        .get(`/tasks/${randomUUID()}/history`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message");
    });

    it("Deve retornar 403 para usuário MEMBER tentando acessar histórico de tarefa de outro usuário", async () => {

      const memberEmail = `member${Date.now()}@example.com`;

      await prisma.user.create({
        data: {
          name: "Member User",
          email: memberEmail,
          password: await hash("password123", 8),
          role: "MEMBER",
        },
      });

      const memberSession = await request(app).post("/sessions").send({
        email: memberEmail,
        password: "password123",
      });

      const memberToken = memberSession.body.token;

      const team = await prisma.team.create({
        data: {
          name: `Test-${Date.now()}`,
        },
      });

      const task = await prisma.task.create({
        data: {
          title: "Task with History",
          teamId: team.id,
          assignedUserId: userId,
        },
      });

      const response = await request(app)
        .get(`/tasks/${task.id}/history`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("message");
    });

    it("Deve permitir MEMBER acessar histórico de tarefa atribuída a ele", async () => {
      const memberEmail = `member${Date.now()}@example.com`;

      const member = await prisma.user.create({
        data: {
          name: "Member User",
          email: memberEmail,
          password: await hash("password123", 8),
          role: "MEMBER",
        },
      });

      const memberSession = await request(app).post("/sessions").send({
        email: memberEmail,
        password: "password123",
      });

      const memberToken = memberSession.body.token;

      const team = await prisma.team.create({
        data: {
          name: `Test-${Date.now()}`,
        },
      });

      const task = await prisma.task.create({
        data: {
          title: "Task with History",
          teamId: team.id,
          assignedUserId: member.id,
        },
      });

      const response = await request(app)
        .get(`/tasks/${task.id}/history`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("history");
      expect(Array.isArray(response.body.history)).toBe(true);
    });
  });

  describe("PATCH /tasks/:id", () => {

    it("Deve atualizar uma tarefa e retornar 200", async () => {
      const team = await prisma.team.create({
        data: { name: `Test-${Date.now()}` },
      });

      const task = await prisma.task.create({
        data: {
          title: "Task to Update",
          teamId: team.id,
          assignedUserId: userId,
        },
      });

      const response = await request(app)
        .patch(`/tasks/${task.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Updated Title" });

      expect(response.status).toBe(200);
      expect(response.body.task.title).toBe("Updated Title");
    });

    it("Deve retornar 404 quando a tarefa não existir", async () => {
      const response = await request(app)
        .patch(`/tasks/${randomUUID()}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Updated Title" });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message");
    });

    it("Deve retornar 401 quando não autenticado", async () => {
      const response = await request(app)
        .patch(`/tasks/${randomUUID()}`)
        .send({ title: "Updated Title" });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
    });


    describe("validações de campos", () => {

      it("Deve retornar 400 se o uuid for inválido", async () => {
        const response = await request(app)
          .patch("/tasks/invalid-uuid")
          .set("Authorization", `Bearer ${token}`)
          .send({
            title: "Updated Title",
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
      });

      it("Deve retornar 400 quando o título estiver vazio", async () => {
        const team = await prisma.team.create({
          data: {
            name: `Test-${Date.now()}`,
          },
        });

        const task = await prisma.task.create({
          data: {
            title: "Task to Update",
            teamId: team.id,
            assignedUserId: userId,
          },
        });

        const response = await request(app)
          .patch(`/tasks/${task.id}`)
          .set("Authorization", `Bearer ${token}`)
          .send({
            title: "",
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
      });

      it("Deve retornar 400 quando o título exceder 255 caracteres", async () => {
        const team = await prisma.team.create({
          data: {
            name: `Test-${Date.now()}`,
          },
        });

        const task = await prisma.task.create({
          data: {
            title: "Task to Update",
            teamId: team.id,
            assignedUserId: userId,
          },
        });

        const response = await request(app)
          .patch(`/tasks/${task.id}`)
          .set("Authorization", `Bearer ${token}`)
          .send({
            title: "a".repeat(256),
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
      });

      it("Deve retornar 400 quando a descrição exceder 1024 caracteres", async () => {
        const team = await prisma.team.create({
          data: {
            name: `Test-${Date.now()}`,
          },
        });

        const task = await prisma.task.create({
          data: {
            title: "Task to Update",
            teamId: team.id,
            assignedUserId: userId,
          },
        });

        const response = await request(app)
          .patch(`/tasks/${task.id}`)
          .set("Authorization", `Bearer ${token}`)
          .send({
            description: "a".repeat(1025),
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
      });

      it("Deve aceitar status e priority válidos", async () => {
        const team = await prisma.team.create({
          data: {
            name: `Test-${Date.now()}`,
          },
        });

        const task = await prisma.task.create({
          data: {
            title: "Task to Update",
            teamId: team.id,
            assignedUserId: userId,
          },
        });

        const response = await request(app)
          .patch(`/tasks/${task.id}`)
          .set("Authorization", `Bearer ${token}`)
          .send({
            status: "PENDING",
            priority: "HIGH"
          });

        expect(response.status).toBe(200);
      });

      it("Deve retornar erro para status inválido", async () => {
        const team = await prisma.team.create({
          data: {
            name: `Test-${Date.now()}`,
          },
        });

        const task = await prisma.task.create({
          data: {
            title: "Task to Update",
            teamId: team.id,
            assignedUserId: userId,
          },
        });

        const response = await request(app)
          .patch(`/tasks/${task.id}`)
          .set("Authorization", `Bearer ${token}`)
          .send({
            status: "INVALID_STATUS"
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
      });

      it("Deve retornar erro para priority inválida", async () => {
        const team = await prisma.team.create({
          data: {
            name: `Test-${Date.now()}`,
          },
        });

        const task = await prisma.task.create({
          data: {
            title: "Task to Update",
            teamId: team.id,
            assignedUserId: userId,
          },
        });

        const response = await request(app)
          .patch(`/tasks/${task.id}`)
          .set("Authorization", `Bearer ${token}`)
          .send({
            priority: "URGENT"
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message");
      });
    });
  });

  describe("DELETE /tasks/:id", () => {
    it("Deve deletar uma tarefa existente e retornar 204", async () => {
      const team = await prisma.team.create({
        data: { name: `Test-${Date.now()}` },
      });
      const task = await prisma.task.create({
        data: {
          title: "Task to Delete",
          teamId: team.id,
          assignedUserId: userId,
        },
      });

      const response = await request(app)
        .delete(`/tasks/${task.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(204)
      expect(response.text).toBe("");

      const taskInDb = await prisma.task.findUnique({
        where: { id: task.id },
      });

      expect(taskInDb).toBeNull();
    });

    it("Deve retornar 404 quando a tarefa não existir", async () => {
      const response = await request(app)
        .delete(`/tasks/${randomUUID()}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message");
    });

    it("Deve retornar 401 quando não autenticado", async () => {
      const response = await request(app)
        .delete(`/tasks/${randomUUID()}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
    });

    it("Deve retornar 400 se o uuid for inválido", async () => {
      const response = await request(app)
        .delete("/tasks/invalid-uuid")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
    });
  });
});
