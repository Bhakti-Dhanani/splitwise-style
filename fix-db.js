const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  await prisma.$queryRaw`UPDATE expenses SET status = 'PAID' WHERE status = 'PENDING' AND "groupId" IN (SELECT "groupId" FROM settlements WHERE settled = true)`
  console.log("Fixed")
}
main()
