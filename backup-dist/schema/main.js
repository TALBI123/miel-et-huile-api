"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// index.ts ou app.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    // Créer un utilisateur
    // const user = await prisma.user.createMany({
    //   data: [
    //     {
    //       firstName: "Jean",
    //       lastName: "Dupont",
    //       email: "jean.dupont@email.com",
    //       password: "$2b$10$abc123def456ghi789jkl0",
    //       termsAccepted: true,
    //     },
    //     // ... autres utilisateurs
    //   ],
    // });
    const user = await prisma.user.findMany({ select: { email: false } });
    // const  
    // console.log("User created:", user);
    // Créer un produit
    // const product = await prisma.product.create({
    //   data: {
    //     name: "Laptop",
    //     price: 999.99,
    //     description: "Gaming laptop"
    //   }
    // })
    // // Créer une commande
    // const order = await prisma.order.create({
    //   data: {
    //     userId: user.id,
    //     productId: product.id,
    //     quantity: 1,
    //     items: {
    //       create: {
    //         quantity: 1,
    //         price: 999.99,
    //         productId: product.id
    //       }
    //     }
    //   },
    //   include: {
    //     items: true,
    //     user: true,
    //     product: true
    //   }
    // })
}
main()
    .catch((res) => console.log("successfully ", res))
    .catch((e) => {
    throw e;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=main.js.map