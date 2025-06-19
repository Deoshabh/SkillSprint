require('dotenv').config();

async function runSeed() {
  const { seedAdminUser } = await import('../src/lib/seed-admin');
  
  try {
    await seedAdminUser();
    console.log('Seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

runSeed();
