// src/scripts/check-england-players.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEnglandPlayers() {
  console.log('🏴󐁧󐁢󐁥󐁮󐁧󐁿 Checking England players...\n');

  // Check specific players
  const playersToCheck = ['Harry Kane', 'Bukayo Saka', 'Jude Bellingham', 'Declan Rice'];
  
  for (const name of playersToCheck) {
    const player = await prisma.player.findFirst({
      where: { 
        name: { contains: name, mode: 'insensitive' } 
      },
      include: {
        playerTeams: {
          include: { team: true },
          take: 5
        }
      }
    });

    if (player) {
      console.log(`✅ ${player.name}`);
      console.log(`   Nationality: ${player.nationality || 'NOT SET'}`);
      console.log(`   Position: ${player.position}`);
      console.log(`   Teams: ${player.playerTeams.map(pt => pt.team.name).join(', ')}`);
    } else {
      console.log(`❌ ${name} NOT FOUND`);
    }
    console.log('');
  }

  // Count England players
  const englandCount = await prisma.player.count({
    where: { nationality: 'England' }
  });

  console.log(`\n📊 Total England players: ${englandCount}`);

  // Check if we have any players without nationality
  const noNationality = await prisma.player.count({
    where: { nationality: null }
  });

  console.log(`⚠️  Players without nationality: ${noNationality}`);

  // Test a simple national team connection
  console.log('\n🧪 Testing national team logic:');
  
  const kane = await prisma.player.findFirst({
    where: { name: { contains: 'Harry Kane', mode: 'insensitive' } }
  });

  if (kane && kane.nationality) {
    const teammates = await prisma.player.findMany({
      where: {
        nationality: kane.nationality,
        id: { not: kane.id }
      },
      take: 5
    });

    console.log(`\nPotential England teammates for ${kane.name}:`);
    teammates.forEach(t => console.log(`   - ${t.name} (${t.position})`));
  }

  // Check query performance
  console.log('\n⚡ Testing query performance:');
  
  const start = Date.now();
  const result = await prisma.player.findMany({
    where: { nationality: 'England' },
    include: {
      playerTeams: {
        include: { team: true }
      }
    },
    take: 10
  });
  const duration = Date.now() - start;
  
  console.log(`Query took ${duration}ms for ${result.length} players with teams`);
}

checkEnglandPlayers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());