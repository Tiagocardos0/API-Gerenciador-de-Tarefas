<h1 align="center">API Rest - Gerenciador De Tarefas</h1>
<div align="center">
    API REST para gerenciamento de tarefas com autenticação JWT, controle de permissões por perfil e histórico de alterações. 
</div>

## 🚀 Tecnologias ##

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens)
![bcryptjs](https://img.shields.io/badge/bcryptjs-003A70?style=for-the-badge)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)
![Supertest](https://img.shields.io/badge/Supertest-000000?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## 🌐 Deploy ##

**Base URL:**

https://api-gerenciador-de-tarefas-ek78.onrender.com

Hospedado na **Render**

## Como Rodar o Projeto ##
Pré-requisito: ter o Docker instalado.<br>
**1. Configurar variáveis de ambiente**<br>
`.env.example .env`<br>
**2. Baixe as imagens e suba os containers**<br>
`docker compose up -d --build`<br>
 **3. Rodar migrations**<br>
 `docker compose exec api npx prisma migrate dev`<br>
 **4. Gere o Prisma Client**<br>
 `docker compose exec api npx prisma generate`

## Variáveis de Ambiente ##
Copie o arquivo **.env.example** e preencha os valores:
`DATABASE_URL="postgresql://user:password@postgres:5432/banco_de_dados_db"`<br>
`JWT_SECRET="sua_chave_secreta"`<br>
`PORT= Porta da API`

## Autenticação ##

A **API** utiliza JWT.

Envie o token no header: Authorization: Bearer <token>

## 👤 Usuários ##

- **POST /users**<br>
Cria um novo usuário

**Body:**

```json
{
  "name": "user",
  "email": "user@email.com",
  "password": "123456"
}
```

## 🔐 Sessões ##
- **POST /sessions**<br>
Realiza login e retorna o token

**Body**
```json
{
  "email": "user@email.com",
  "password": "123456"
}
```

## 📋 Tarefas ##
- **POST /tasks**<br>
Cria uma nova tarefa
- **GET /tasks**<br>
Lista tarefas do usuário autenticado
- **PATCH /tasks/:id**<br>
Atualiza uma tarefa
- **DELETE /tasks/:id**<br>
Remove uma tarefa

## 👥 Times ##
- **POST /teams**<br>
O Admin cria um novo time
- **GET /teams**<br>
O Admin vizualiza todos os times
- **PUT /teams/:id**<br>
O Admin edita o time (nome e descrição)
- **DELETE /teams/:id**<br>
O Admin deleta o time

## 👤 Membros ##
- **POST /members**<br>
O Admin adiciona membros ao time
- **GET /members**<br>
O Admin vizualiza todos os times com seus membros
- **DELETE /members/:id**<br>
O Admin deleta membro do time

## 🕓 Histórico ##
- **GET /tasks/:id/history**<br>
Retorna o histórico de alterações de uma tarefa

## Regras de Negócio ##
- Usuário precisa estar autenticado para acessar tarefas.
- Usuários do tipo MEMBER só acessa, vizualiza, edita e deleta suas próprias tarefas.
- ADMIN pode acessar e criar tudo.
- Senhas são armazenadas com hash.

## Tratamento de erros ##
- `400` → erro de validação
- `401` → não autenticado
- `403` → sem permissão
- `404` → recurso não encontrado

## Testes ##

**Para rodar os testes:**<br>
`npm run test:dev`

**Os testes cobrem:**
- criação de usuário
- autenticação
- fluxo completo de tarefas
- validações e permissões

## Observações ##
- O projeto utiliza Prisma para acesso ao banco
- Estrutura baseada em controllers e rotas
- Testes de integração com Supertest
- Há um arquivo de rotas para importar no Insomnia na raiz do projeto.

## Autor ##
Feito por `Tiago Cardoso`, Projeto desenvolvido para estudo e prática de backend.<br>
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/tiago-cardoso-059b9529b/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Tiagocardos0)