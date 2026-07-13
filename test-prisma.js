const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const filter = 'this_month';
  const now = new Date();
  let startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  console.log('startDate:', startDate);
  const splits = await prisma.expenseSplit.findMany({
    where: {
      userId: '8KPZxnZohMwkzROtxi9WLNpw0ySM259t',
      expense: {
        date: { gte: startDate }
      }
    },
    include: {
      expense: true
    }
  });
  console.log('Splits count:', splits.length);
  splits.forEach(s => console.log(s.expense.date));
}
main().catch(console.error).finally(() => prisma.$disconnect());
