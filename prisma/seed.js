const { PrismaClient } = require('../lib/generated/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set in .env');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Iniciando carga de datos (Seeding)...');

  // Limpiar datos existentes antes de insertar
  console.log('Limpiando tablas...');
  await prisma.property.deleteMany();

  console.log('Creando 3 propiedades principales...');
  const prop1 = await prisma.property.create({
    data: {
      id: 'prop-1',
      name: 'Zen Oasis Cabin',
      address: 'Camino a Valle de Bravo, Metepéc',
      colorCode: '#10b981',
    }
  });

  const prop2 = await prisma.property.create({
    data: {
      id: 'prop-2',
      name: 'Urban Heights Loft',
      address: 'Av. Mazatlán 142, Condesa, CDMX',
      colorCode: '#6366f1',
    }
  });

  const prop3 = await prisma.property.create({
    data: {
      id: 'prop-3',
      name: 'Costa Brava Beachhouse',
      address: 'Passeig del Mar 12, Calella de Palafrugell',
      colorCode: '#0ea5e9',
    }
  });

  console.log('Propiedades creadas con éxito:', [prop1.name, prop2.name, prop3.name]);

  console.log('Creando elementos de inventario iniciales...');
  await prisma.inventoryItem.createMany({
    data: [
      { propertyId: 'prop-1', name: 'Cápsulas de Café Nespresso', currentStock: 24, minStock: 15, unit: 'cápsulas' },
      { propertyId: 'prop-1', name: 'Toallas de baño extra', currentStock: 8, minStock: 6, unit: 'unidades' },
      { propertyId: 'prop-2', name: 'Jabón líquido corporal (recarga)', currentStock: 2, minStock: 5, unit: 'frascos' },
      { propertyId: 'prop-2', name: 'Cápsulas de Café Nespresso', currentStock: 12, minStock: 15, unit: 'cápsulas' },
      { propertyId: 'prop-3', name: 'Papel higiénico premium', currentStock: 16, minStock: 12, unit: 'rollos' },
    ]
  });

  console.log('Inventario inicial creado.');
  
  console.log('Creando tareas iniciales para hoy...');
  const today = new Date();
  await prisma.task.createMany({
    data: [
      {
        propertyId: 'prop-1',
        title: 'Limpieza Express y Cambio de Blancos',
        description: 'Preparar cabaña para el próximo check-in hoy.',
        dueDate: today,
        status: 'PENDING',
        type: 'CLEANING',
      },
      {
        propertyId: 'prop-2',
        title: 'Reabastecer cápsulas y café',
        description: 'Stock actual por debajo del mínimo (12/15).',
        dueDate: today,
        status: 'PENDING',
        type: 'CLEANING',
      }
    ]
  });

  console.log('Tareas iniciales creadas.');
  console.log('¡Seeding completado con éxito!');

  await pool.end();
}

main().catch(err => {
  console.error('Error durante el seeding:', err);
  process.exit(1);
});
