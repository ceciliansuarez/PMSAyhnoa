import { PrismaClient } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as mock from './mock-data';

const hasDbUrl = typeof process !== 'undefined' && !!process.env.DATABASE_URL;

// Singleton for Prisma Client to avoid "too many connections" in hot reload/serverless environments
const prismaClientSingleton = () => {
  if (hasDbUrl) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }
  return null;
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
  var mockDbGlobal: undefined | {
    properties: mock.Property[];
    spaces: mock.PropertySpace[];
    bookings: mock.Booking[];
    inventory: mock.InventoryItem[];
    finances: mock.FinancialRecord[];
    tasks: mock.Task[];
  };
}

const prisma = hasDbUrl ? (globalThis.prismaGlobal ?? prismaClientSingleton()) : null;

if (hasDbUrl && process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

// Initialize mock DB in globalThis to persist through Next.js hot reloads in development
if (!globalThis.mockDbGlobal) {
  globalThis.mockDbGlobal = {
    properties: [...mock.INITIAL_PROPERTIES],
    spaces: [...mock.INITIAL_SPACES],
    bookings: [...mock.INITIAL_BOOKINGS],
    inventory: [...mock.INITIAL_INVENTORY],
    finances: [...mock.INITIAL_FINANCES],
    tasks: [...mock.INITIAL_TASKS],
  };
}
const mockDb = globalThis.mockDbGlobal;

// Helper to simulate small database delay
const delay = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

export const db = {
  isMock: !hasDbUrl,
  
  properties: {
    findMany: async (args?: { include?: { bookings?: boolean; inventory?: boolean; finances?: boolean; tasks?: boolean; spaces?: boolean } }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.property.findMany(args as any);
      }
      return mockDb.properties.map(p => ({
        ...p,
        bookings: args?.include?.bookings ? mockDb.bookings.filter(b => b.propertyId === p.id) : undefined,
        inventory: args?.include?.inventory ? mockDb.inventory.filter(i => i.propertyId === p.id) : undefined,
        finances: args?.include?.finances ? mockDb.finances.filter(f => f.propertyId === p.id) : undefined,
        tasks: args?.include?.tasks ? mockDb.tasks.filter(t => t.propertyId === p.id) : undefined,
        spaces: args?.include?.spaces ? mockDb.spaces.filter(s => s.propertyId === p.id) : undefined,
      }));
    },
    findUnique: async (args: { where: { id: string } }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.property.findUnique(args as any);
      }
      return mockDb.properties.find(p => p.id === args.where.id) || null;
    },
    create: async (args: { data: { name: string; address: string; colorCode: string } }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.property.create(args as any);
      }
      const newProperty: mock.Property = {
        id: `prop-${Math.random().toString(36).substring(2, 9)}`,
        ...args.data,
      };
      mockDb.properties.push(newProperty);
      return newProperty;
    },
    update: async (args: { where: { id: string }; data: Partial<mock.Property> }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.property.update(args as any);
      }
      const idx = mockDb.properties.findIndex(p => p.id === args.where.id);
      if (idx === -1) throw new Error('Property not found');
      mockDb.properties[idx] = {
        ...mockDb.properties[idx],
        ...args.data,
      };
      return mockDb.properties[idx];
    },
    delete: async (args: { where: { id: string } }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.property.delete(args as any);
      }
      const idx = mockDb.properties.findIndex(p => p.id === args.where.id);
      if (idx === -1) throw new Error('Property not found');
      const deleted = mockDb.properties[idx];
      mockDb.properties.splice(idx, 1);
      
      // Cascade delete related mock elements
      mockDb.bookings = mockDb.bookings.filter(b => b.propertyId !== args.where.id);
      mockDb.inventory = mockDb.inventory.filter(i => i.propertyId !== args.where.id);
      mockDb.finances = mockDb.finances.filter(f => f.propertyId !== args.where.id);
      mockDb.tasks = mockDb.tasks.filter(t => t.propertyId !== args.where.id);
      mockDb.spaces = mockDb.spaces.filter(s => s.propertyId !== args.where.id);
      
      return deleted;
    }
  },

  spaces: {
    findMany: async (args?: { where?: { propertyId?: string } }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.propertySpace.findMany(args as any);
      }
      let list = [...mockDb.spaces];
      if (args?.where?.propertyId) {
        list = list.filter(s => s.propertyId === args.where!.propertyId);
      }
      return list;
    },
    create: async (args: { data: { propertyId: string; name: string } }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.propertySpace.create(args as any);
      }
      const newSpace: mock.PropertySpace = {
        id: `space-${Math.random().toString(36).substring(2, 9)}`,
        ...args.data,
      };
      mockDb.spaces.push(newSpace);
      return newSpace;
    },
    update: async (args: { where: { id: string }; data: { name: string } }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.propertySpace.update(args as any);
      }
      const idx = mockDb.spaces.findIndex(s => s.id === args.where.id);
      if (idx === -1) throw new Error('Space not found');
      mockDb.spaces[idx] = {
        ...mockDb.spaces[idx],
        name: args.data.name,
      };
      return mockDb.spaces[idx];
    },
    delete: async (args: { where: { id: string } }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.propertySpace.delete(args as any);
      }
      const idx = mockDb.spaces.findIndex(s => s.id === args.where.id);
      if (idx === -1) throw new Error('Space not found');
      const deleted = mockDb.spaces[idx];
      mockDb.spaces.splice(idx, 1);
      
      // Cascade delete mock inventory items that belong to this space
      mockDb.inventory = mockDb.inventory.filter(i => i.spaceId !== args.where.id);
      return deleted;
    }
  },

  bookings: {
    findMany: async (args?: { where?: { propertyId?: string }; orderBy?: { checkIn?: 'asc' | 'desc' } }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.booking.findMany(args as any);
      }
      let list = [...mockDb.bookings];
      if (args?.where?.propertyId) {
        list = list.filter(b => b.propertyId === args.where!.propertyId);
      }
      if (args?.orderBy?.checkIn) {
        list.sort((a, b) => {
          const t1 = new Date(a.checkIn).getTime();
          const t2 = new Date(b.checkIn).getTime();
          return args.orderBy!.checkIn === 'asc' ? t1 - t2 : t2 - t1;
        });
      }
      return list;
    },
    create: async (args: { data: Omit<mock.Booking, 'id'> }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.booking.create(args as any);
      }
      const newBooking: mock.Booking = {
        id: `book-${Math.random().toString(36).substring(2, 9)}`,
        ...args.data,
        checkIn: new Date(args.data.checkIn),
        checkOut: new Date(args.data.checkOut),
      };
      mockDb.bookings.push(newBooking);
      return newBooking;
    },
    update: async (args: { where: { id: string }; data: Partial<mock.Booking> }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.booking.update(args as any);
      }
      const idx = mockDb.bookings.findIndex(b => b.id === args.where.id);
      if (idx === -1) throw new Error('Booking not found');
      
      const updated = {
        ...mockDb.bookings[idx],
        ...args.data,
      };
      if (args.data.checkIn) updated.checkIn = new Date(args.data.checkIn);
      if (args.data.checkOut) updated.checkOut = new Date(args.data.checkOut);
      
      mockDb.bookings[idx] = updated as mock.Booking;
      return updated;
    },
    delete: async (args: { where: { id: string } }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.booking.delete(args as any);
      }
      const idx = mockDb.bookings.findIndex(b => b.id === args.where.id);
      if (idx === -1) throw new Error('Booking not found');
      const deleted = mockDb.bookings[idx];
      mockDb.bookings.splice(idx, 1);
      return deleted;
    }
  },

  inventory: {
    findMany: async (args?: { where?: { propertyId?: string }; include?: { space?: boolean } }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.inventoryItem.findMany(args as any);
      }
      let list = [...mockDb.inventory];
      if (args?.where?.propertyId) {
        list = list.filter(i => i.propertyId === args.where!.propertyId);
      }
      return list.map(item => ({
        ...item,
        space: args?.include?.space && item.spaceId ? mockDb.spaces.find(s => s.id === item.spaceId) : undefined,
      }));
    },
    update: async (args: { where: { id: string }; data: Partial<mock.InventoryItem> }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.inventoryItem.update(args as any);
      }
      const idx = mockDb.inventory.findIndex(i => i.id === args.where.id);
      if (idx === -1) throw new Error('Inventory item not found');
      const updated = {
        ...mockDb.inventory[idx],
        ...args.data,
      };
      mockDb.inventory[idx] = updated as mock.InventoryItem;
      return updated;
    },
    create: async (args: { data: Omit<mock.InventoryItem, 'id'> }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.inventoryItem.create(args as any);
      }
      const newInventory: mock.InventoryItem = {
        id: `inv-${Math.random().toString(36).substring(2, 9)}`,
        spaceId: args.data.spaceId || null,
        name: args.data.name,
        currentStock: args.data.currentStock,
        minStock: args.data.minStock,
        unit: args.data.unit,
        category: args.data.category || 'General',
        subCategory: args.data.subCategory || null,
        propertyId: args.data.propertyId,
      };
      mockDb.inventory.push(newInventory);
      return newInventory;
    },
    delete: async (args: { where: { id: string } }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.inventoryItem.delete(args as any);
      }
      const idx = mockDb.inventory.findIndex(i => i.id === args.where.id);
      if (idx === -1) throw new Error('Inventory item not found');
      const deleted = mockDb.inventory[idx];
      mockDb.inventory.splice(idx, 1);
      return deleted;
    }
  },

  finances: {
    findMany: async (args?: { where?: { propertyId?: string }; orderBy?: { date?: 'asc' | 'desc' } }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.financialRecord.findMany(args as any);
      }
      let list = [...mockDb.finances];
      if (args?.where?.propertyId) {
        list = list.filter(f => f.propertyId === args.where!.propertyId);
      }
      if (args?.orderBy?.date) {
        list.sort((a, b) => {
          const t1 = new Date(a.date).getTime();
          const t2 = new Date(b.date).getTime();
          return args.orderBy!.date === 'asc' ? t1 - t2 : t2 - t1;
        });
      }
      return list;
    },
    create: async (args: { data: Omit<mock.FinancialRecord, 'id'> }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.financialRecord.create(args as any);
      }
      const newRecord: mock.FinancialRecord = {
        id: `fin-${Math.random().toString(36).substring(2, 9)}`,
        ...args.data,
        date: new Date(args.data.date || new Date()),
      };
      mockDb.finances.push(newRecord);
      return newRecord;
    }
  },

  tasks: {
    findMany: async (args?: { where?: { propertyId?: string }; orderBy?: { dueDate?: 'asc' | 'desc' } }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.task.findMany(args as any);
      }
      let list = [...mockDb.tasks];
      if (args?.where?.propertyId) {
        list = list.filter(t => t.propertyId === args.where!.propertyId);
      }
      if (args?.orderBy?.dueDate) {
        list.sort((a, b) => {
          const t1 = new Date(a.dueDate).getTime();
          const t2 = new Date(b.dueDate).getTime();
          return args.orderBy!.dueDate === 'asc' ? t1 - t2 : t2 - t1;
        });
      }
      return list;
    },
    create: async (args: { data: Omit<mock.Task, 'id'> }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.task.create(args as any);
      }
      const newTask: mock.Task = {
        id: `task-${Math.random().toString(36).substring(2, 9)}`,
        ...args.data,
        dueDate: new Date(args.data.dueDate),
      };
      mockDb.tasks.push(newTask);
      return newTask;
    },
    update: async (args: { where: { id: string }; data: Partial<mock.Task> }) => {
      await delay();
      if (hasDbUrl && prisma) {
        return prisma.task.update(args as any);
      }
      const idx = mockDb.tasks.findIndex(t => t.id === args.where.id);
      if (idx === -1) throw new Error('Task not found');
      
      const updated = {
        ...mockDb.tasks[idx],
        ...args.data,
      };
      if (args.data.dueDate) updated.dueDate = new Date(args.data.dueDate);
      
      mockDb.tasks[idx] = updated as mock.Task;
      return updated;
    }
  }
};
