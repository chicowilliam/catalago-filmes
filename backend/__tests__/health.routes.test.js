const request = require("supertest");
const AppError = require("../utils/AppError");

describe("Health Route", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env.ADMIN_USERNAME = "admin";
    process.env.ADMIN_PASSWORD = "admin123";
    process.env.SESSION_SECRET = "test-secret";
    process.env.NODE_ENV = "test";
    process.env.TMDB_BEARER_TOKEN = "test-token";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("GET /api/health deve retornar status básico", async () => {
    const app = require("../../server");
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.service).toBe("catalog-api");
    expect(response.body.requestId).toBeDefined();
    expect(response.body.dependencies).toBeUndefined();
  });

  test("GET /api/health?deep=tmdb deve retornar status da dependência", async () => {
    jest.doMock("../services/tmdb.service", () => {
      const actual = jest.requireActual("../services/tmdb.service");
      return {
        ...actual,
        pingTmdb: jest.fn().mockRejectedValue(new AppError("TMDB fora", 503, "TMDB_DOWN")),
      };
    });

    const app = require("../../server");
    const response = await request(app).get("/api/health?deep=tmdb");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.dependencies).toBeDefined();
    expect(response.body.dependencies.tmdb.status).toBe("down");
    expect(response.body.dependencies.tmdb.code).toBe("TMDB_DOWN");
  });
});
