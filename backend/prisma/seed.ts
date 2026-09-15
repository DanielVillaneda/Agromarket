import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Datos de ejemplo, tomados de los mismos productos "quemados" que usaba
 * ProductsService en el frontend antes de tener backend, para que la app
 * se vea igual apenas se conecte a esta API.
 */
async function main() {
  const passwordHash = await bcrypt.hash('agromarket123', 10);

  const carlos = await prisma.user.upsert({
    where: { email: 'carlos.perez@agromarket.co' },
    update: {},
    create: {
      nombre: 'Carlos Pérez',
      email: 'carlos.perez@agromarket.co',
      telefono: '3201234567',
      passwordHash,
    },
  });

  const maria = await prisma.user.upsert({
    where: { email: 'maria.gomez@agromarket.co' },
    update: {},
    create: {
      nombre: 'María Gómez',
      email: 'maria.gomez@agromarket.co',
      telefono: '3109876543',
      passwordHash,
    },
  });

  const demoBuyer = await prisma.user.upsert({
    where: { email: 'demo@agromarket.co' },
    update: {},
    create: {
      nombre: 'Usuario Demo',
      email: 'demo@agromarket.co',
      telefono: '3000000000',
      passwordHash,
    },
  });

  const marketProducts = [
    {
      title: 'Abono 100% orgánico',
      price: 30000,
      location: 'Rivera · Huila',
      icon: 'leaf-outline',
      accent: 'linear-gradient(135deg, #8d6e63, #5d4037)',
      description:
        'Abono orgánico elaborado a partir de compost natural, ideal para mejorar la fertilidad del suelo sin usar químicos.',
      quantity: 50,
      sellerId: carlos.id,
      photos: ['leaf-outline', 'nutrition-outline', 'flower-outline'],
    },
    {
      title: 'Pollitos Criollos para criar',
      price: 5000,
      location: 'Campoalegre · Huila',
      icon: 'egg-outline',
      accent: 'linear-gradient(135deg, #ffca28, #fb8c00)',
      description: 'Pollitos criollos de un día de nacidos, criados en finca, resistentes y de buena postura.',
      quantity: 30,
      sellerId: maria.id,
      photos: ['egg-outline', 'paw-outline', 'leaf-outline'],
    },
    {
      title: 'Semillas para Siembra',
      price: 5000,
      location: 'Rivera · Huila',
      icon: 'flower-outline',
      accent: 'linear-gradient(135deg, #9ccc65, #558b2f)',
      description: 'Semillas seleccionadas de hortalizas, con alto porcentaje de germinación.',
      quantity: 100,
      sellerId: carlos.id,
      photos: ['flower-outline', 'leaf-outline', 'basket-outline'],
    },
    {
      title: 'Yogurt Artesanal',
      price: 15000,
      location: 'Palermo · Huila',
      icon: 'nutrition-outline',
      accent: 'linear-gradient(135deg, #90caf9, #42a5f5)',
      description: 'Yogurt artesanal elaborado con leche fresca de finca, sin conservantes.',
      quantity: 20,
      sellerId: maria.id,
      photos: ['nutrition-outline', 'cafe-outline', 'restaurant-outline'],
    },
    {
      title: 'Queso Artesanal',
      price: 25000,
      location: 'Yaguará · Huila',
      icon: 'restaurant-outline',
      accent: 'linear-gradient(135deg, #fff59d, #fdd835)',
      description: 'Queso campesino artesanal, elaborado de forma tradicional con leche de vaca.',
      quantity: 15,
      sellerId: carlos.id,
      photos: ['restaurant-outline', 'nutrition-outline', 'basket-outline'],
    },
    {
      title: 'Ruanas de lana tejidas a mano',
      price: 60000,
      location: 'La Plata · Huila',
      icon: 'shirt-outline',
      accent: 'linear-gradient(135deg, #ce93d8, #8e24aa)',
      description: 'Ruanas 100% lana virgen, tejidas a mano por artesanas de la región.',
      quantity: 8,
      sellerId: maria.id,
      photos: ['shirt-outline', 'leaf-outline', 'basket-outline'],
    },
    // "Mis productos" del usuario demo, para poder probar la página de Venta.
    {
      title: 'Café Orgánico de Altura',
      price: 18000,
      location: 'Neiva · Huila',
      icon: 'cafe-outline',
      accent: 'linear-gradient(135deg, #8d6e63, #4e342e)',
      description: 'Café cultivado en las montañas del Huila, tueste medio, cosechado a mano.',
      quantity: 25,
      sellerId: demoBuyer.id,
      photos: ['cafe-outline', 'leaf-outline', 'basket-outline'],
    },
    {
      title: 'Aguacate Hass',
      price: 8000,
      location: 'Rivera · Huila',
      icon: 'nutrition-outline',
      accent: 'linear-gradient(135deg, #9ccc65, #558b2f)',
      description: 'Aguacates Hass frescos, cosechados en finca, ideales para consumo directo.',
      quantity: 40,
      sellerId: demoBuyer.id,
      photos: ['nutrition-outline', 'leaf-outline', 'basket-outline'],
    },
  ];

  for (const product of marketProducts) {
    const { photos, ...rest } = product;
    await prisma.product.create({
      data: { ...rest, photos: { create: photos.map((url) => ({ url })) } },
    });
  }

  console.log('Seed completado. Usuarios de prueba (contraseña "agromarket123"):');
  console.log('- carlos.perez@agromarket.co');
  console.log('- maria.gomez@agromarket.co');
  console.log('- demo@agromarket.co (tiene productos propios para probar "Venta")');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
