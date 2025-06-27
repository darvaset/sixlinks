// src/scripts/maintenance/fix-duplicate-teams.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Team name mappings - add more as needed
const TEAM_MAPPINGS: Record<string, string> = {
  'Bayern Munich': 'FC Bayern München',
  'FC Bayern Munich': 'FC Bayern München',
  'Bayern München': 'FC Bayern München',
  
  'Real Madrid': 'Real Madrid CF',
  'Real Madrid C.F.': 'Real Madrid CF',
  
  'Barcelona': 'FC Barcelona',
  'Barcelona FC': 'FC Barcelona',
  
  'Manchester United': 'Manchester United FC',
  'Man United': 'Manchester United FC',
  'Man Utd': 'Manchester United FC',
  
  'Manchester City': 'Manchester City FC',
  'Man City': 'Manchester City FC',
  
  'Arsenal': 'Arsenal FC',
  'Arsenal F.C.': 'Arsenal FC',
  
  'Liverpool': 'Liverpool FC',
  'Liverpool F.C.': 'Liverpool FC',
  
  'Chelsea': 'Chelsea FC',
  'Chelsea F.C.': 'Chelsea FC',
  
  'Tottenham': 'Tottenham Hotspur',
  'Tottenham Hotspur FC': 'Tottenham Hotspur',
  'Spurs': 'Tottenham Hotspur',
  
  'PSG': 'Paris Saint-Germain',
  'Paris SG': 'Paris Saint-Germain',
  'Paris St-Germain': 'Paris Saint-Germain',
  
  'Atletico Madrid': 'Atlético Madrid',
  'Atletico de Madrid': 'Atlético Madrid',
  'Atlético de Madrid': 'Atlético Madrid',
  
  'Inter Milan': 'Inter Milan',
  'Internazionale': 'Inter Milan',
  'FC Internazionale Milano': 'Inter Milan',
  
  'AC Milan': 'AC Milan',
  'Milan': 'AC Milan',
  'Associazione Calcio Milan': 'AC Milan',
  
  'Juventus': 'Juventus FC',
  'Juventus F.C.': 'Juventus FC',
  'Juve': 'Juventus FC'
};

async function fixDuplicateTeams() {
  console.log('🔧 Fixing duplicate teams...\n');

  // Get all teams
  const teams = await prisma.team.findMany({
    include: {
      _count: {
        select: {
          playerTeams: true,
          managerTeams: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Group teams by their canonical name
  const teamGroups = new Map<string, typeof teams>();
  
  teams.forEach(team => {
    const canonicalName = TEAM_MAPPINGS[team.name] || team.name;
    if (!teamGroups.has(canonicalName)) {
      teamGroups.set(canonicalName, []);
    }
    teamGroups.get(canonicalName)!.push(team);
  });

  // Process duplicates
  let mergeCount = 0;
  
  for (const [canonicalName, teamList] of teamGroups) {
    if (teamList.length > 1) {
      console.log(`\n📍 Found ${teamList.length} variations of "${canonicalName}":`);
      
      // Sort by number of connections (descending) to keep the most connected one
      teamList.sort((a, b) => {
        const aConnections = a._count.playerTeams + a._count.managerTeams;
        const bConnections = b._count.playerTeams + b._count.managerTeams;
        return bConnections - aConnections;
      });

      const [primaryTeam, ...duplicates] = teamList;
      
      console.log(`  Primary: "${primaryTeam.name}" (ID: ${primaryTeam.id}, Connections: ${primaryTeam._count.playerTeams + primaryTeam._count.managerTeams})`);
      
      for (const duplicate of duplicates) {
        console.log(`  Duplicate: "${duplicate.name}" (ID: ${duplicate.id}, Connections: ${duplicate._count.playerTeams + duplicate._count.managerTeams})`);
        
        try {
          // Update player connections
          const playerUpdates = await prisma.playerTeam.updateMany({
            where: { teamId: duplicate.id },
            data: { teamId: primaryTeam.id }
          });
          
          // Update manager connections
          const managerUpdates = await prisma.managerTeam.updateMany({
            where: { teamId: duplicate.id },
            data: { teamId: primaryTeam.id }
          });
          
          // Delete the duplicate team
          await prisma.team.delete({
            where: { id: duplicate.id }
          });
          
          console.log(`    ✅ Merged: ${playerUpdates.count} player connections, ${managerUpdates.count} manager connections`);
          mergeCount++;
          
        } catch (error) {
          console.error(`    ❌ Error merging ${duplicate.name}:`, error);
        }
      }
    }
  }

  console.log(`\n✅ Merged ${mergeCount} duplicate teams`);

  // Update the primary teams to use canonical names
  console.log('\n📝 Standardizing team names...');
  
  for (const [oldName, canonicalName] of Object.entries(TEAM_MAPPINGS)) {
    const updated = await prisma.team.updateMany({
      where: { name: oldName },
      data: { name: canonicalName }
    });
    
    if (updated.count > 0) {
      console.log(`  ✅ Renamed "${oldName}" → "${canonicalName}"`);
    }
  }

  // Final statistics
  const finalStats = await prisma.team.count();
  console.log(`\n📊 Final team count: ${finalStats}`);
}

// Add confirmation prompt
async function main() {
  console.log('⚠️  This script will merge duplicate teams and update all connections.');
  console.log('It\'s recommended to backup your database first.');
  console.log('\nDuplicate teams to be merged:');
  console.log('- Bayern Munich variations → FC Bayern München');
  console.log('- Real Madrid variations → Real Madrid CF');
  console.log('- And others as defined in TEAM_MAPPINGS\n');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Do you want to proceed? (yes/no): ', async (answer) => {
    if (answer.toLowerCase() === 'yes') {
      await fixDuplicateTeams();
    } else {
      console.log('❌ Operation cancelled');
    }
    
    readline.close();
    await prisma.$disconnect();
  });
}

main().catch(console.error);