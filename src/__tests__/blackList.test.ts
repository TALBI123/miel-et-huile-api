import request from "supertest";
import app from "../app";
let token: string;
describe("Auth tests", () => {
  // it("should login successfully and set a cookie", async () => {
  //   const res = await request(app).post("/login").send({
  //     email: "morocostudent@gmail.com",
  //     password: "mhayeb",
  //   });
  //   token = res.header["set-cookie"][0];
  //   console.log(token);
  //   expect(res.status).toBe(200);
  //   // expect(res.body).toEqual({ message: "pong" });
  // });

  
  // it('should access protected route /me with valid token', async () => {
  //   const res = await request(app)
  //     .get("/me")
  //     .set("Cookie", token);
  //     console.log(res.body);
  //   expect(res.status).toBe(200);
  // });

  // it("should log user info", async () => {
  //   const res = await request(app).get("/logout").set("Cookie", token);
  //   console.log(res.body);
  //   expect(res.status).toBe(200);
  // });

  // it('should not access protected route /me with invalid token', async () => {
  //   const res = await request(app)
  //     .get("/me")
  //     .set("Cookie", token);
  //     console.log(res.body);
  //   expect(res.status).toBe(401);
  // });

  // it('should return /products in less than 200ms', async () => {
  //   const start = Date.now();
  //   const res = await request(app).get("/products?limit=1");
  //   const duration = Date.now() - start;
  //   console.log(res.body);
  //   expect(res.status).toBe(200);
  //   expect(duration).toBeLessThan(200);
  // });
  it("POST /login résiste à une tentative d'injection SQL", async () => {
  const payload = {
    email: "a' OR '1'='1",
    password: "anything"
  };

  const res = await request(app).post("/login").send(payload);

  // on s'attend soit à 401, soit à 400 selon ton implémentation
  expect([400, 401]).toContain(res.status);

  // optionnel : vérifier qu'aucune ligne inattendue n'a été renvoyée
  // expect(res.body).not.toHaveProperty("user");
});

  // it("should return user information", async () => {
  //   const res = await request(app).get("/me");
  //   console.log(res.headers);
  // });
  // it("should handle 404", async () => {
  //   const res = await request(app).get("/products");
  //   console.log(res.headers);
  //   expect(res.status).toBe(200);
  // });
});
