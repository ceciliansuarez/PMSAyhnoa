export interface Property {
  id: string;
  name: string;
  address: string;
  colorCode: string;
}

export interface PropertySpace {
  id: string;
  propertyId: string;
  name: string;
}

export interface Booking {
  id: string;
  propertyId: string;
  guestName: string;
  checkIn: Date;
  checkOut: Date;
  totalRevenue: number;
  platform: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | string;
}

export interface InventoryItem {
  id: string;
  propertyId: string;
  spaceId: string | null;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
  category: 'General' | 'Reposición' | string;
  subCategory: string | null; // vajilla, utensilios, electrodomesticos, consumibles
  itemType: 'OPERATIVO' | 'ACTIVO' | string;
}

export interface FinancialRecord {
  id: string;
  propertyId: string;
  type: 'INCOME' | 'EXPENSE' | string;
  category: string;
  amount: number;
  date: Date;
  description: string | null;
}

export interface Task {
  id: string;
  propertyId: string;
  title: string;
  description: string | null;
  dueDate: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | string;
  type: 'CLEANING' | 'MAINTENANCE' | string;
}

// Relative date helper
const getDateOffset = (days: number, hoursOffset: number = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(d.getHours() + hoursOffset);
  return d;
};

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    name: 'Zen Oasis Cabin',
    address: 'Camino a Valle de Bravo, Metepéc',
    colorCode: '#10b981', // Emerald
  },
  {
    id: 'prop-2',
    name: 'Urban Heights Loft',
    address: 'Av. Mazatlán 142, Condesa, CDMX',
    colorCode: '#6366f1', // Indigo
  },
  {
    id: 'prop-3',
    name: 'Costa Brava Beachhouse',
    address: 'Passeig del Mar 12, Calella de Palafrugell',
    colorCode: '#0ea5e9', // Sky
  },
];

// Default spaces for each property
export const INITIAL_SPACES: PropertySpace[] = [
  // Zen Oasis Cabin (prop-1)
  { id: 'space-1-1', propertyId: 'prop-1', name: 'Habitación 1' },
  { id: 'space-1-2', propertyId: 'prop-1', name: 'Cocina' },
  { id: 'space-1-3', propertyId: 'prop-1', name: 'Comedor' },
  { id: 'space-1-4', propertyId: 'prop-1', name: 'Living' },
  { id: 'space-1-5', propertyId: 'prop-1', name: 'Baño' },

  // Urban Heights Loft (prop-2)
  { id: 'space-2-1', propertyId: 'prop-2', name: 'Habitación 1' },
  { id: 'space-2-2', propertyId: 'prop-2', name: 'Cocina' },
  { id: 'space-2-3', propertyId: 'prop-2', name: 'Comedor' },
  { id: 'space-2-4', propertyId: 'prop-2', name: 'Living' },
  { id: 'space-2-5', propertyId: 'prop-2', name: 'Baño' },

  // Costa Brava Beachhouse (prop-3)
  { id: 'space-3-1', propertyId: 'prop-3', name: 'Habitación 1' },
  { id: 'space-3-2', propertyId: 'prop-3', name: 'Cocina' },
  { id: 'space-3-3', propertyId: 'prop-3', name: 'Comedor' },
  { id: 'space-3-4', propertyId: 'prop-3', name: 'Living' },
  { id: 'space-3-5', propertyId: 'prop-3', name: 'Baño' },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'book-1',
    propertyId: 'prop-1',
    guestName: 'Alejandro Rossi',
    checkIn: getDateOffset(-3),
    checkOut: getDateOffset(0, -2),
    totalRevenue: 380.00,
    platform: 'Airbnb',
    status: 'CONFIRMED',
  },
  {
    id: 'book-2',
    propertyId: 'prop-1',
    guestName: 'Sarah Jenkins',
    checkIn: getDateOffset(0, 2),
    checkOut: getDateOffset(4),
    totalRevenue: 520.00,
    platform: 'Airbnb',
    status: 'CONFIRMED',
  },
  {
    id: 'book-3',
    propertyId: 'prop-2',
    guestName: 'Mateo Fernández',
    checkIn: getDateOffset(-1),
    checkOut: getDateOffset(3),
    totalRevenue: 640.00,
    platform: 'Airbnb',
    status: 'CONFIRMED',
  },
  {
    id: 'book-4',
    propertyId: 'prop-3',
    guestName: 'Elena Rostova',
    checkIn: getDateOffset(1),
    checkOut: getDateOffset(6),
    totalRevenue: 1200.00,
    platform: 'Airbnb',
    status: 'PENDING',
  },
  {
    id: 'book-5',
    propertyId: 'prop-3',
    guestName: 'Lucas Dupont',
    checkIn: getDateOffset(-6),
    checkOut: getDateOffset(-2),
    totalRevenue: 950.00,
    platform: 'Booking.com',
    status: 'CONFIRMED',
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    propertyId: 'prop-1',
    spaceId: 'space-1-2', // Cocina
    name: 'Cápsulas de Café Nespresso',
    currentStock: 24,
    minStock: 15,
    unit: 'cápsulas',
    category: 'General',
    subCategory: 'Consumibles',
    itemType: 'OPERATIVO',
  },
  {
    id: 'inv-2',
    propertyId: 'prop-1',
    spaceId: 'space-1-5', // Baño
    name: 'Toallas de baño extra',
    currentStock: 8,
    minStock: 6,
    unit: 'unidades',
    category: 'General',
    subCategory: null,
    itemType: 'OPERATIVO',
  },
  {
    id: 'inv-3',
    propertyId: 'prop-2',
    spaceId: 'space-2-5', // Baño
    name: 'Jabón líquido corporal (recarga)',
    currentStock: 2,
    minStock: 5,
    unit: 'frascos',
    category: 'General',
    subCategory: null,
    itemType: 'OPERATIVO',
  },
  {
    id: 'inv-4',
    propertyId: 'prop-2',
    spaceId: 'space-2-2', // Cocina
    name: 'Cápsulas de Café Nespresso',
    currentStock: 12,
    minStock: 15,
    unit: 'cápsulas',
    category: 'General',
    subCategory: 'Consumibles',
    itemType: 'OPERATIVO',
  },
  {
    id: 'inv-5',
    propertyId: 'prop-3',
    spaceId: 'space-3-5', // Baño
    name: 'Papel higiénico premium',
    currentStock: 16,
    minStock: 12,
    unit: 'rollos',
    category: 'General',
    subCategory: null,
    itemType: 'OPERATIVO',
  },
  {
    id: 'inv-6',
    propertyId: 'prop-3',
    spaceId: null, // Reposición (general)
    name: 'Kit de Amenities de Bienvenida',
    currentStock: 10,
    minStock: 8,
    unit: 'kits',
    category: 'Reposición',
    subCategory: null,
    itemType: 'OPERATIVO',
  },
  {
    id: 'inv-7',
    propertyId: 'prop-1',
    spaceId: 'space-1-2', // Cocina
    name: 'Platos playeros',
    currentStock: 6,
    minStock: 6,
    unit: 'unidades',
    category: 'General',
    subCategory: 'Vajilla y Cubertería',
    itemType: 'OPERATIVO',
  },
  {
    id: 'inv-8',
    propertyId: 'prop-1',
    spaceId: 'space-1-2', // Cocina
    name: 'Sartén antiadherente Tefal',
    currentStock: 2,
    minStock: 2,
    unit: 'unidades',
    category: 'General',
    subCategory: 'Utensilios y Menaje',
    itemType: 'OPERATIVO',
  },
  {
    id: 'inv-9',
    propertyId: 'prop-1',
    spaceId: 'space-1-2', // Cocina
    name: 'Tostadora eléctrica',
    currentStock: 1,
    minStock: 1,
    unit: 'unidad',
    category: 'General',
    subCategory: 'Electrodomésticos',
    itemType: 'ACTIVO', // Tostadora is a fixed asset
  },
  // Active Assets (Equipamiento)
  {
    id: 'inv-10',
    propertyId: 'prop-1',
    spaceId: 'space-1-1', // Habitación 1
    name: 'Aire Acondicionado Split',
    currentStock: 1,
    minStock: 1,
    unit: 'unidad',
    category: 'General',
    subCategory: null,
    itemType: 'ACTIVO',
  },
  {
    id: 'inv-11',
    propertyId: 'prop-1',
    spaceId: 'space-1-1', // Habitación 1
    name: 'Cama Matrimonial King',
    currentStock: 1,
    minStock: 1,
    unit: 'unidad',
    category: 'General',
    subCategory: null,
    itemType: 'ACTIVO',
  },
  {
    id: 'inv-12',
    propertyId: 'prop-1',
    spaceId: 'space-1-4', // Living
    name: 'Televisión Smart TV 55"',
    currentStock: 1,
    minStock: 1,
    unit: 'unidad',
    category: 'General',
    subCategory: null,
    itemType: 'ACTIVO',
  }
];

export const INITIAL_FINANCES: FinancialRecord[] = [
  {
    id: 'fin-1',
    propertyId: 'prop-1',
    type: 'INCOME',
    category: 'Reserva',
    amount: 380.00,
    date: getDateOffset(-3),
    description: 'Reserva Airbnb - Alejandro Rossi',
  },
  {
    id: 'fin-2',
    propertyId: 'prop-1',
    type: 'EXPENSE',
    category: 'Limpieza',
    amount: 60.00,
    date: getDateOffset(0),
    description: 'Limpieza salida Alejandro Rossi',
  },
  {
    id: 'fin-3',
    propertyId: 'prop-2',
    type: 'INCOME',
    category: 'Reserva',
    amount: 640.00,
    date: getDateOffset(-1),
    description: 'Reserva Airbnb - Mateo Fernández',
  },
  {
    id: 'fin-4',
    propertyId: 'prop-2',
    type: 'EXPENSE',
    category: 'Mantenimiento',
    amount: 110.00,
    date: getDateOffset(-5),
    description: 'Reparación cerradura electrónica inteligente',
  },
  {
    id: 'fin-5',
    propertyId: 'prop-3',
    type: 'INCOME',
    category: 'Reserva',
    amount: 950.00,
    date: getDateOffset(-6),
    description: 'Reserva Booking.com - Lucas Dupont',
  },
  {
    id: 'fin-6',
    propertyId: 'prop-3',
    type: 'EXPENSE',
    category: 'Servicios',
    amount: 85.00,
    date: getDateOffset(-10),
    description: 'Servicio de Internet Fibra Óptica mensual',
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    propertyId: 'prop-1',
    title: 'Limpieza Express y Cambio de Blancos',
    description: 'Preparar cabaña para el Check-in de Sarah Jenkins hoy a las 15:00. Salida de Alejandro Rossi completada.',
    dueDate: getDateOffset(0),
    status: 'PENDING',
    type: 'CLEANING',
  },
  {
    id: 'task-2',
    propertyId: 'prop-2',
    title: 'Reabastecer cápsulas y café',
    description: 'Stock actual por debajo del mínimo (12/15). Comprar pack de 30 unidades.',
    dueDate: getDateOffset(0),
    status: 'IN_PROGRESS',
    type: 'CLEANING',
  },
  {
    id: 'task-3',
    propertyId: 'prop-2',
    title: 'Fijar repisa del baño principal',
    description: 'Huésped reporta que la repisa flotante está floja. Traer taladro y taquetes.',
    dueDate: getDateOffset(1),
    status: 'PENDING',
    type: 'MAINTENANCE',
  },
  {
    id: 'task-4',
    propertyId: 'prop-3',
    title: 'Mantenimiento del filtro de la piscina',
    description: 'Revisión técnica de la bomba e inspección de cloro.',
    dueDate: getDateOffset(-1),
    status: 'COMPLETED',
    type: 'MAINTENANCE',
  },
];
