const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const expenses = await prisma.expense.findMany();
  console.log('Expenses:', expenses);
  const splits = await prisma.expenseSplit.findMany();
  console.log('Splits:', splits);
}
main().catch(console.error).finally(() => prisma.$disconnect());
