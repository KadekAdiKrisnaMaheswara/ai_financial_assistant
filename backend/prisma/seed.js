import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  await prisma.category.createMany({
    data: [
      {
        name: "Food",
        icon: "utensils",
        color: "#22C55E",
        type: "expense",
        is_default: true
      },
      {
        name: "Transport",
        icon: "car",
        color: "#3B82F6",
        type: "expense",
        is_default: true
      },
      {
        name: "Salary",
        icon: "wallet",
        color: "#7C3AED",
        type: "income",
        is_default: true
      },
      {
        name: "Entertainment",
        icon: "gamepad",
        color: "#F59E0B",
        type: "expense",
        is_default: true
      }
    ],
    skipDuplicates: true
  })

  console.log("Seed success!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })