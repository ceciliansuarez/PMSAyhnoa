import DashboardClient from '@/components/dashboard-client';
import { db } from '@/lib/db';

export const revalidate = 0; // Disable full caching for real-time mutations

export default async function DashboardPage() {
  // Fetch data from our dual-mode database wrapper
  const properties = await db.properties.findMany({
    include: {
      bookings: true,
      inventory: true,
      finances: true,
      tasks: true,
      spaces: true,
    },
  });

  const bookings = await db.bookings.findMany({
    orderBy: { checkIn: 'asc' },
  });

  const spaces = await db.spaces.findMany();
  const inventory = await db.inventory.findMany();
  const finances = await db.finances.findMany({
    orderBy: { date: 'desc' },
  });

  const tasks = await db.tasks.findMany({
    orderBy: { dueDate: 'asc' },
  });

  // Calculate current month's financial metrics
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const currentMonthFinances = finances.filter((f) => {
    const fDate = new Date(f.date);
    return fDate.getMonth() === currentMonth && fDate.getFullYear() === currentYear;
  });

  const grossIncome = currentMonthFinances
    .filter((f) => f.type === 'INCOME')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpenses = currentMonthFinances
    .filter((f) => f.type === 'EXPENSE')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netProfit = grossIncome - totalExpenses;

  const kpis = {
    grossIncome,
    totalExpenses,
    netProfit,
  };

  return (
    <DashboardClient
      properties={properties}
      spaces={spaces}
      bookings={bookings}
      inventory={inventory}
      finances={finances}
      tasks={tasks}
      kpis={kpis}
    />
  );
}
