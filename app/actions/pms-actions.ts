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

  const property = await db.properties.create({
    data: {
      name: formData.name,
      address: formData.address,
      colorCode: formData.colorCode,
    },
  });

  // Automatically create the 5 default spaces
  const defaultSpaces = ['Habitación 1', 'Cocina', 'Comedor', 'Living', 'Baño'];
  for (const spaceName of defaultSpaces) {
    await db.spaces.create({
      data: {
        propertyId: property.id,
        name: spaceName,
      }
    });
  }

  revalidatePath('/dashboard');
  revalidatePath('/calendar');
  return { success: true };
}

export async function updateProperty(formData: {
  id: string;
  name: string;
  address: string;
  colorCode: string;
}) {
  await db.properties.update({
    where: { id: formData.id },
    data: {
      name: formData.name,
      address: formData.address,
      colorCode: formData.colorCode,
    }
  });

  revalidatePath('/dashboard');
  revalidatePath('/calendar');
  return { success: true };
}

export async function deleteProperty(propertyId: string) {
  await db.properties.delete({
    where: { id: propertyId }
  });

  revalidatePath('/dashboard');
  revalidatePath('/calendar');
  return { success: true };
}

// SPACES
export async function createSpace(formData: {
  propertyId: string;
  name: string;
}) {
  await db.spaces.create({
    data: {
      propertyId: formData.propertyId,
      name: formData.name,
    }
  });

  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateSpaceName(formData: {
  id: string;
  name: string;
}) {
  await db.spaces.update({
    where: { id: formData.id },
    data: { name: formData.name }
  });

  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteSpace(spaceId: string) {
  await db.spaces.delete({
    where: { id: spaceId }
  });

  revalidatePath('/dashboard');
  return { success: true };
}

// INVENTORY ITEMS
export async function createInventoryItem(formData: {
  propertyId: string;
  spaceId?: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
  category?: string;
  subCategory?: string;
  itemType?: string;
}) {
  await db.inventory.create({
    data: {
      propertyId: formData.propertyId,
      spaceId: formData.spaceId || null,
      name: formData.name,
      currentStock: formData.currentStock,
      minStock: formData.minStock,
      unit: formData.unit,
      category: formData.category || 'General',
      subCategory: formData.subCategory || null,
      itemType: formData.itemType || 'OPERATIVO',
    },
  });

  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateInventoryItem(formData: {
  id: string;
  propertyId: string;
  spaceId?: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
  category?: string;
  subCategory?: string;
  itemType?: string;
}) {
  await db.inventory.update({
    where: { id: formData.id },
    data: {
      propertyId: formData.propertyId,
      spaceId: formData.spaceId || null,
      name: formData.name,
      currentStock: formData.currentStock,
      minStock: formData.minStock,
      unit: formData.unit,
      category: formData.category || 'General',
      subCategory: formData.subCategory || null,
      itemType: formData.itemType || 'OPERATIVO',
    },
  });

  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteInventoryItem(itemId: string) {
  await db.inventory.delete({
    where: { id: itemId }
  });

  revalidatePath('/dashboard');
  return { success: true };
}

export async function seedKitchenEquipment(formData: {
  propertyId: string;
  spaceId: string;
}) {
  const items = [
    // Vajilla y Cubertería (Operational consumables)
    { name: 'Tenedores de mesa', currentStock: 12, minStock: 10, unit: 'unidades', category: 'General', subCategory: 'Vajilla y Cubertería', itemType: 'OPERATIVO' },
    { name: 'Cuchillos de mesa', currentStock: 12, minStock: 10, unit: 'unidades', category: 'General', subCategory: 'Vajilla y Cubertería', itemType: 'OPERATIVO' },
    { name: 'Cucharas soperas', currentStock: 12, minStock: 10, unit: 'unidades', category: 'General', subCategory: 'Vajilla y Cubertería', itemType: 'OPERATIVO' },
    { name: 'Cucharitas de café', currentStock: 12, minStock: 10, unit: 'unidades', category: 'General', subCategory: 'Vajilla y Cubertería', itemType: 'OPERATIVO' },
    { name: 'Vasos de vidrio', currentStock: 12, minStock: 10, unit: 'unidades', category: 'General', subCategory: 'Vajilla y Cubertería', itemType: 'OPERATIVO' },
    { name: 'Copas de vino', currentStock: 8, minStock: 6, unit: 'unidades', category: 'General', subCategory: 'Vajilla y Cubertería', itemType: 'OPERATIVO' },
    { name: 'Platos playos', currentStock: 12, minStock: 10, unit: 'unidades', category: 'General', subCategory: 'Vajilla y Cubertería', itemType: 'OPERATIVO' },
    { name: 'Platos hondos', currentStock: 8, minStock: 6, unit: 'unidades', category: 'General', subCategory: 'Vajilla y Cubertería', itemType: 'OPERATIVO' },
    { name: 'Platos de postre', currentStock: 12, minStock: 10, unit: 'unidades', category: 'General', subCategory: 'Vajilla y Cubertería', itemType: 'OPERATIVO' },
    { name: 'Tazas de café', currentStock: 8, minStock: 6, unit: 'unidades', category: 'General', subCategory: 'Vajilla y Cubertería', itemType: 'OPERATIVO' },

    // Utensilios y Menaje (Active Fixed Assets)
    { name: 'Set de ollas y cacerolas', currentStock: 1, minStock: 0, unit: 'unidad', category: 'General', subCategory: 'Utensilios y Menaje', itemType: 'ACTIVO' },
    { name: 'Sartén antiadherente', currentStock: 2, minStock: 0, unit: 'unidades', category: 'General', subCategory: 'Utensilios y Menaje', itemType: 'ACTIVO' },
    { name: 'Tablas de picar', currentStock: 4, minStock: 0, unit: 'unidades', category: 'General', subCategory: 'Utensilios y Menaje', itemType: 'ACTIVO' },
    { name: 'Rallador de queso', currentStock: 1, minStock: 0, unit: 'unidad', category: 'General', subCategory: 'Utensilios y Menaje', itemType: 'ACTIVO' },
    { name: 'Jarra de agua', currentStock: 1, minStock: 0, unit: 'unidad', category: 'General', subCategory: 'Utensilios y Menaje', itemType: 'ACTIVO' },
    { name: 'Sacacorchos / Abrebotellas', currentStock: 2, minStock: 0, unit: 'unidades', category: 'General', subCategory: 'Utensilios y Menaje', itemType: 'ACTIVO' },
    { name: 'Cuchillo de chef', currentStock: 2, minStock: 0, unit: 'unidades', category: 'General', subCategory: 'Utensilios y Menaje', itemType: 'ACTIVO' },
    { name: 'Ensaladera de vidrio', currentStock: 2, minStock: 0, unit: 'unidades', category: 'General', subCategory: 'Utensilios y Menaje', itemType: 'ACTIVO' },

    // Electrodomésticos (Active Fixed Assets)
    { name: 'Cafetera eléctrica', currentStock: 1, minStock: 0, unit: 'unidad', category: 'General', subCategory: 'Electrodomésticos', itemType: 'ACTIVO' },
    { name: 'Tostadora eléctrica', currentStock: 1, minStock: 0, unit: 'unidad', category: 'General', subCategory: 'Electrodomésticos', itemType: 'ACTIVO' },
    { name: 'Horno Microondas', currentStock: 1, minStock: 0, unit: 'unidad', category: 'General', subCategory: 'Electrodomésticos', itemType: 'ACTIVO' },
    { name: 'Hervidor eléctrico de agua', currentStock: 1, minStock: 0, unit: 'unidad', category: 'General', subCategory: 'Electrodomésticos', itemType: 'ACTIVO' },

    // Consumibles e Insumos (Operational consumables)
    { name: 'Esponja de trastes', currentStock: 2, minStock: 2, unit: 'unidades', category: 'General', subCategory: 'Consumibles', itemType: 'OPERATIVO' },
    { name: 'Jabón líquido para vajilla', currentStock: 1, minStock: 1, unit: 'frasco', category: 'General', subCategory: 'Consumibles', itemType: 'OPERATIVO' },
    { name: 'Paños de cocina de tela', currentStock: 3, minStock: 2, unit: 'unidades', category: 'General', subCategory: 'Consumibles', itemType: 'OPERATIVO' },
    { name: 'Bolsas de basura de cocina', currentStock: 10, minStock: 5, unit: 'unidades', category: 'General', subCategory: 'Consumibles', itemType: 'OPERATIVO' },
  ];

  for (const item of items) {
    await db.inventory.create({
      data: {
        propertyId: formData.propertyId,
        spaceId: formData.spaceId,
        ...item
      }
    });
  }

  revalidatePath('/dashboard');
  return { success: true };
}
