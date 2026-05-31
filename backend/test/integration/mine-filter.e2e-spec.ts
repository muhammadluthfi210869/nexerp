// @ts-nocheck
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/prisma/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";

describe("?mine=true Filter — Backend E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();

    // Find a user with known leads
    const user = await prisma.user.findFirst({
      where: {
        roles: { hasSome: ["COMMERCIAL"] },
        status: "ACTIVE",
      },
    });
    if (user) {
      userId = user.id;
      userToken = jwtService.sign({ sub: userId, email: user.email, roles: user.roles });
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /bussdev/leads", () => {
    it("returns all leads without ?mine filter", async () => {
      const res = await request(app.getHttpServer())
        .get("/bussdev/leads")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("returns only user's leads with ?mine=true", async () => {
      const res = await request(app.getHttpServer())
        .get("/bussdev/leads?mine=true")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      // All returned leads should belong to this user
      for (const lead of res.body) {
        if (lead.bdId) {
          expect(lead.bdId).toBe(userId);
        }
      }
    });
  });

  describe("GET /finance/fund-requests", () => {
    it("returns all without ?mine filter", async () => {
      const res = await request(app.getHttpServer())
        .get("/finance/fund-requests")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("returns user's fund requests with ?mine=true", async () => {
      const res = await request(app.getHttpServer())
        .get("/finance/fund-requests?mine=true")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      for (const fr of res.body) {
        if (fr.requesterId || fr.approvedById) {
          const isMine = fr.requesterId === userId || fr.approvedById === userId;
          expect(isMine).toBe(true);
        }
      }
    });
  });

  describe("GET /my-dashboard/stats", () => {
    it("returns personal stats for authenticated user", async () => {
      const res = await request(app.getHttpServer())
        .get("/my-dashboard/stats")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("userId");
      expect(res.body).toHaveProperty("cards");
      expect(res.body).toHaveProperty("recentActivity");
      expect(res.body).toHaveProperty("pendingAudits");
    });

    it("rejects unauthenticated requests", async () => {
      await request(app.getHttpServer())
        .get("/my-dashboard/stats")
        .expect(401);
    });
  });

  describe("GET /auth/login", () => {
    it("allows login with valid credentials", async () => {
      const user = await prisma.user.findFirst({
        where: { status: "ACTIVE" },
      });
      if (user) {
        const res = await request(app.getHttpServer())
          .post("/auth/login")
          .send({ email: user.email, password: "password123" })
          .expect(201); // NestJS POST returns 201 by default
        expect(res.body).toHaveProperty("access_token");
      }
    });
  });
});
