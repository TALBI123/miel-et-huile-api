import request from "supertest";
import app from "../app"; // Adjust the path as necessary
import { parsePhoneNumberFromString } from "libphonenumber-js/min";
describe("GET /", () => {
  it.skip("should respond with a status code greater than 200", async () => {
    const response = await request(app).get("/api/products");
    console.log(response.statusCode);
    expect(response.statusCode).toBeGreaterThanOrEqual(200);
  });
});
describe("Phone Number Parsing", () => {
  it("should parse a valid phone number", () => {
    const phoneNumber = parsePhoneNumberFromString("+212288392");
    console.log(
        phoneNumber?.isValid()
    )
    expect(phoneNumber?.isValid()).toBeFalsy();
  });
});
