// src/scripts/maintenance/check-data-quality.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDataQuality() {
  console.log('🔍 Checking data quality issues...\n');

  // 1. Check for duplicate teams
  console.log('🏟️  DUPLICATE TEAMS CHECK:');
  console.log('─'.repeat(50));
  
  const teams = await prisma.team.findMany({
    orderBy: { name: 'asc' }
  });

  const teamGroups = new Map<string, typeof teams>();
  
  teams.forEach(team => {
    // Normalize team names for comparison
    const normalized = team.name
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/fc\b/g, '')
      .replace(/cf\b/g, '')
      .replace(/\./g, '')
      .trim();
    
    if (!teamGroups.has(normalized)) {
      teamGroups.set(normalized, []);
    }
    teamGroups.get(normalized)!.push(team);
  });

  // Find duplicates
  const duplicates: any[] = [];
  teamGroups.forEach((teams, normalized) => {
    if (teams.length > 1) {
      duplicates.push({ normalized, teams });
    }
  });

  if (duplicates.length > 0) {
    console.log(`Found ${duplicates.length} potential duplicate team groups:\n`);
    duplicates.forEach(({ normalized, teams }) => {
      console.log(`Duplicate group: "${normalized}"`);
      teams.forEach(team => {
        console.log(`  - ID: ${team.id}, Name: "${team.name}", League: ${team.league || 'N/A'}`);
      });
      console.log('');
    });
  } else {
    console.log('✅ No duplicate teams found');
  }

  // 2. Check for players with missing data (using empty string checks)
  console.log('\n👤 PLAYERS WITH MISSING DATA:');
  console.log('─'.repeat(50));
  
  const allPlayers = await prisma.player.findMany({
    include: {
      playerTeams: {
        include: { team: true },
        take: 1
      }
    }
  });

  const playersWithIssues = allPlayers.filter(player => 
    !player.name || player.name === '' ||
    !player.nationality || player.nationality === '' ||
    !player.position || player.position === ''
  );

  if (playersWithIssues.length > 0) {
    console.log(`Found ${playersWithIssues.length} players with missing data:\n`);
    playersWithIssues.slice(0, 10).forEach(player => {
      console.log(`Player ID: ${player.id}`);
      console.log(`  Name: "${player.name}" ${!player.name ? '❌' : '✅'}`);
      console.log(`  Nationality: "${player.nationality || 'NULL'}" ${!player.nationality ? '❌' : '✅'}`);
      console.log(`  Position: "${player.position || 'NULL'}" ${!player.position ? '❌' : '✅'}`);
      console.log(`  Team: ${player.playerTeams[0]?.team.name || 'No team'}`);
      console.log('');
    });
    
    if (playersWithIssues.length > 10) {
      console.log(`... and ${playersWithIssues.length - 10} more players with issues\n`);
    }
  } else {
    console.log('✅ All players have required data');
  }

  // 3. Check for managers with missing data
  console.log('\n👔 MANAGERS WITH MISSING DATA:');
  console.log('─'.repeat(50));
  
  const allManagers = await prisma.manager.findMany();
  const managersWithIssues = allManagers.filter(manager =>
    !manager.name || manager.name === '' ||
    !manager.nationality || manager.nationality === ''
  );

  if (managersWithIssues.length > 0) {
    console.log(`Found ${managersWithIssues.length} managers with missing data:\n`);
    managersWithIssues.forEach(manager => {
      console.log(`Manager ID: ${manager.id}`);
      console.log(`  Name: "${manager.name}" ${!manager.name ? '❌' : '✅'}`);
      console.log(`  Nationality: "${manager.nationality || 'NULL'}" ${!manager.nationality ? '❌' : '✅'}`);
      console.log('');
    });
  } else {
    console.log('✅ All managers have required data');
  }

  // 4. Summary statistics
  console.log('\n📊 DATA QUALITY SUMMARY:');
  console.log('─'.repeat(50));
  
  const playersWithNationality = allPlayers.filter(p => p.nationality && p.nationality !== '').length;
  const playersWithPosition = allPlayers.filter(p => p.position && p.position !== '').length;
  
  console.log(`Total players: ${allPlayers.length}`);
  console.log(`  - With nationality: ${playersWithNationality} (${((playersWithNationality/allPlayers.length)*100).toFixed(1)}%)`);
  console.log(`  - With position: ${playersWithPosition} (${((playersWithPosition/allPlayers.length)*100).toFixed(1)}%)`);
  console.log(`Total teams: ${teams.length} (${duplicates.length} duplicate groups)`);
  console.log(`Total managers: ${allManagers.length}`);

  // 5. Check connections per team
  console.log('\n🔗 CONNECTIONS PER DUPLICATE TEAM:');
  console.log('─'.repeat(50));
  
  for (const { teams } of duplicates.slice(0, 5)) {
    for (const team of teams) {
      const connections = await prisma.playerTeam.count({
        where: { teamId: team.id }
      });
      console.log(`"${team.name}": ${connections} player connections`);
    }
    console.log('');
  }
}

checkDataQuality()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
