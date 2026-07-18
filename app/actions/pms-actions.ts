'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

// BOOKINGS
export async function createOrUpdateBooking(formData: {
  id?: string;
  propertyId: string;
  guestName: string;
  checkIn: string; // ISO String or Date representation
  checkOut: string; // ISO String or Date representation
  totalRevenue: number;
  platform: string;
  status: string;
}) {
  const checkInDate = new Date(formData.checkIn);
  const checkOutDate = new Date(formData.checkOut);

  if (formData.id) {
    // Update
    await db.bookings.update({
      where: { id: formData.id },
      data: {
        propertyId: formData.propertyId,
        guestName: formData.guestName,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalRevenue: formData.totalRevenue,
        platform: formData.platform,
        status: formData.status,
      },
    });
  } else {
    // Create
    const booking = await db.bookings.create({
      data: {
        propertyId: formData.propertyId,
        guestName: formData.guestName,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalRevenue: formData.totalRevenue,
        platform: formData.platform,
        status: formData.status,
      },
    });
    
    // Automatically record an INCOME transaction for confirmed bookings
    if (formData.status === 'CONFIRMED') {
      await db.finances.create({
        data: {
          propertyId: formData.propertyId,
          type: 'INCOME',
          category: 'Reserva',
          amount: formData.totalRevenue,
          date: checkInDate, // Date of checkin or today
          description: `Reserva ${formData.platform} - ${formData.guestName}`,
        }
      });
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/calendar');
  return { success: true };
}

export async function deleteBooking(bookingId: string) {
  await db.bookings.delete({
    where: { id: bookingId }
  });
  
  revalidatePath('/dashboard');
  revalidatePath('/calendar');
  return { success: true };
}

// INVENTORY
export async function adjustInventoryStock(itemId: string, newStock: number) {
  if (newStock < 0) {
    throw new Error('Stock cannot be negative');
  }

  await db.inventory.update({
    where: { id: itemId },
    data: { currentStock: newStock },
  });

  revalidatePath('/dashboard');
  return { success: true };
}

// FINANCES
export async function recordFinanceTransaction(formData: {
  propertyId: string;
  type: string; // INCOME, EXPENSE
  category: string;
  amount: number;
  description?: string;
  date?: string;
}) {
  await db.finances.create({
    data: {
      propertyId: formData.propertyId,
      type: formData.type,
      category: formData.category,
      amount: formData.amount,
      date: formData.date ? new Date(formData.date) : new Date(),
      description: formData.description || null,
    },
  });

  revalidatePath('/dashboard');
  return { success: true };
}

// TASKS
export async function updateTaskStatus(taskId: string, status: string) {
  await db.tasks.update({
    where: { id: taskId },
    data: { status },
  });

  revalidatePath('/dashboard');
  return { success: true };
}

export async function createTask(formData: {
  propertyId: string;
  title: string;
  description?: string;
  dueDate: string;
  status: string;
  type: string;
}) {
  await db.tasks.create({
    data: {
      propertyId: formData.propertyId,
      title: formData.title,
      description: formData.description || null,
      dueDate: new Date(formData.dueDate),
      status: formData.status,
      type: formData.type,
    },
  });

  revalidatePath('/dashboard');
  return { success: true };
}

// PROPERTIES
export async function createProperty(formData: {
  name: string;
  address: string;
  colorCode: string;
}) {
  const currentProperties = await db.properties.findMany();
  if (currentProperties.length >= 3) {
    throw new Error('El sistema PMS está limitado a un máximo de 3 propiedades.');
  }

  await db.properties.create({
    data: {
      name: formData.name,
      address: formData.address,
      colorCode: formData.colorCode,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/calendar');
  return { success: true };
}

// INVENTORY ITEMS
export async function createInventoryItem(formData: {
  propertyId: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
}) {
  await db.inventory.create({
    data: {
      propertyId: formData.propertyId,
      name: formData.name,
      currentStock: formData.currentStock,
      minStock: formData.minStock,
      unit: formData.unit,
    },
  });

  revalidatePath('/dashboard');
  return { success: true };
}
