import CalendarClient from '@/components/calendar-client';
import { db } from '@/lib/db';

export const revalidate = 0; // Ensure real-time updates after bookings are added/deleted

export default async function CalendarPage() {
  // Fetch properties and bookings
  const properties = await db.properties.findMany();
  const bookings = await db.bookings.findMany({
    orderBy: { checkIn: 'asc' },
  });

  return (
    <CalendarClient 
      properties={properties} 
      bookings={bookings} 
    />
  );
}
