// src/scripts/setup-data-collection.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function setupDataCollection() {
  console.log('🚀 Setting up SixLinks data collection...\n');

  // Check database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  // Check current data
  const stats = await prisma.$transaction([
    prisma.player.count(),
    prisma.team.count(),
    prisma.playerTeam.count()
  ]);

  console.log('\n📊 Current database status:');
  console.log(`   Players: ${stats[0]}`);
  console.log(`   Teams: ${stats[1]}`);
  console.log(`   Connections: ${stats[2]}`);

  // Check for API keys
  console.log('\n🔑 Checking API keys...');
  
  if (process.env.FOOTBALL_DATA_API_KEY) {
    console.log('✅ Football-data.org API key found');
  } else {
    console.log('⚠️  No Football-data.org API key found');
    console.log('   Get your FREE key at: https://www.football-data.org/client/register');
    console.log('   Add to .env: FOOTBALL_DATA_API_KEY=your_key_here');
  }

  // Create necessary directories
  console.log('\n📁 Creating directories...');
  const dirs = ['./logs', './reports', './data-archive'];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`   Created: ${dir}`);
    } else {
      console.log(`   Exists: ${dir}`);
    }
  });

  // Setup recommendations
  console.log('\n📋 Setup recommendations:');
  console.log('\n1. For immediate data collection:');
  console.log('   npx tsx src/scripts/collection/smart-data-collector.ts');
  
  console.log('\n2. For scheduled collection:');
  console.log('   npx tsx src/scripts/jobs/scheduled-collector.ts');
  
  console.log('\n3. To run collection immediately:');
  console.log('   npx tsx src/scripts/jobs/scheduled-collector.ts now');
  
  console.log('\n4. For data integrity check:');
  console.log('   npx tsx src/scripts/maintenance/check-data-integrity.ts');

  // Check if cron is needed
  console.log('\n⏰ Scheduling options:');
  console.log('   - During transfer windows (Jun-Aug, Jan): Daily updates at 3 AM');
  console.log('   - Off-season: Weekly updates on Sundays at 3 AM');
  console.log('   - Current period: ' + (isTransferWindow() ? 'TRANSFER WINDOW (daily)' : 'Off-season (weekly)'));

  console.log('\n✅ Setup complete!');
}

function isTransferWindow(): boolean {
  const month = new Date().getMonth() + 1;
  return (month >= 6 && month <= 8) || month === 1;
}

// Run setup
setupDataCollection()
  .catch(console.error)
  .finally(() => prisma.$disconnect());