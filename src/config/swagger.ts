import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

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
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Serveur de développement",
      },
      {
        url: "https://miel-et-huile-api-production.up.railway.app/api",
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
      // AJOUTEZ LES PARAMÈTRES ET SCHÉMAS ICI
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Numéro de page pour la pagination (exemple : 1 pour la première page)',
          required: false,
          schema: {
            type: 'integer',
            default: 1
          }
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Nombre d\'éléments par page (exemple : 10 pour 10 éléments par page)',
          required: false,
          schema: {
            type: 'integer',
            default: 5
          }
        },
        SearchParam: {
          name: 'search',
          in: 'query',
          description: 'Recherche textuelle (insensible à la casse) par nom ou titre d\'objet',
          required: false,
          schema: {
            type: 'string'
          }
        },
        ModeParam: {
          name: 'mode',
          in: 'query',
          description: 'Détermine comment les relations (produits ou variantes) sont prises en compte : - **with** : uniquement ceux qui possèdent au moins une relation - **without** : uniquement ceux qui ne possèdent aucune relation - **all** : renvoie tous sans restriction (par défaut)',
          required: false,
          schema: {
            type: 'string',
            enum: ['with', 'without', 'all'],
            default: 'all'
          }
        }
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            message: { type: "string", example: "Server error" },
            success: { type: "boolean", example: false },
          },
        },
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
        CommonQueryParams: {
          type: "object",
          description: "Schéma générique pour les paramètres de requête communs à la plupart des endpoints.",
          properties: {
            page: {
              type: "integer",
              default: 1
            },
            limit: {
              type: "integer",
              default: 5
            },
            search: {
              type: "string"
            },
            mode: {
              type: "string",
              enum: ["with", "without", "all"],
              default: "all"
            }
          }
        }
      },
    },
    security: [{ cookieAuth: [] }],
  },
  apis: ["./src/routes/**/*.ts"],
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);

export const setupSwagger = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
};