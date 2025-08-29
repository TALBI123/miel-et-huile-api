// index.ts ou app.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Créer un utilisateur
  const user = await prisma.user.create({
    data: {
      email: "john@example.com",
      name: "John Doe"
    }
  })

  // Créer un produit
  const product = await prisma.product.create({
    data: {
      name: "Laptop",
      price: 999.99,
      description: "Gaming laptop"
    }
  })

  // Créer une commande
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      productId: product.id,
      quantity: 1,
      items: {
        create: {
          quantity: 1,
          price: 999.99,
          productId: product.id
        }
      }
    },
    include: {
      items: true,
      user: true,
      product: true
    }
  })

  console.log("Order created:", order)
}

main()
  .catch(e => {
    throw e
  })
  .finally(async () => {
    await prisma.$disconnect()
  })