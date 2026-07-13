const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const sets = await prisma.settlement.findMany({ where: { groupId: '4c6280c3-454b-416a-b0a4-64d8d4d1081c' } })
  console.log(sets)
  const splits = await prisma.expenseSplit.findMany({ where: { expenseId: 'a76eaf9d-ec00-46c9-9ffc-03bf3c7378e3' } })
  console.log(splits)
}
main()
