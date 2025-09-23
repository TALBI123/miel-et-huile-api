import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API E-commerce Miel & Dashboard",
      version: "1.0.0",
      description: "Documentation complète de l'API du E-commerce miel app",
      contact: {
        name: "Support Technique",
        email: "support@dashboard.com",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Serveur de développement",
        },
        {
          url: "https://ecommerce-miel.onrender.com",
          description: "Serveur de production",
        },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "access_token",
          },
        },
        schemas: {
          Error: {
            type: "object",
            properties: {
              message: { type: "string", example: "Server error" },
              success: { type: "boolean", example: false },
            },
          },
          // Schéma pour le filtrage avancé
          FilterOptions: {
            type: "object",
            properties: {
              page: { type: "integer", example: 1 },
              limit: { type: "integer", example: 10 },
              sortBy: { type: "string", example: "price" },
              order: { type: "string", enum: ["asc", "desc"], example: "asc" },
              search: { type: "string", example: "honey" },
              filters: {
                type: "object",
                additionalProperties: true,
              },
            },
          },
        },
      },
      security: [{ cookieAuth: [] }],
    },
  },
  apis: ["./src/routes/*.ts"],
};
export const swaggerSpecs = swaggerJsdoc(swaggerOptions);
