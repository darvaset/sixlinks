// src/scripts/maintenance/fix-remaining-duplicates.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixRemainingDuplicates() {
  console.log('🔧 Fixing remaining duplicate teams...\n');

  // Specific duplicates to fix
  const duplicatesToFix = [
    {
      keep: 'Aston Villa FC',
      remove: 'Aston Villa'
    },
    {
      keep: 'Paris Saint-Germain FC', 
      remove: 'Paris Saint-Germain'
    }
  ];

  for (const { keep, remove } of duplicatesToFix) {
    console.log(`\n📍 Merging "${remove}" into "${keep}"...`);
    
    try {
      // Find both teams
      const keepTeam = await prisma.team.findFirst({
        where: { name: keep }
      });
      
      const removeTeam = await prisma.team.findFirst({
        where: { name: remove }
      });
      
      if (!keepTeam || !removeTeam) {
        console.log('❌ Could not find one of the teams');
        continue;
      }
      
      // Count connections before merge
      const removeConnections = await prisma.playerTeam.count({
        where: { teamId: removeTeam.id }
      });
      
      console.log(`  - "${remove}" has ${removeConnections} connections`);
      
      // Update all player connections
      const updated = await prisma.playerTeam.updateMany({
        where: { teamId: removeTeam.id },
        data: { teamId: keepTeam.id }
      });
      
      console.log(`  - Moved ${updated.count} connections to "${keep}"`);
      
      // Delete the duplicate team
      await prisma.team.delete({
        where: { id: removeTeam.id }
      });
      
      console.log(`  ✅ Successfully merged and deleted "${remove}"`);
      
    } catch (error) {
      console.error(`❌ Error:`, error);
    }
  }
  
  // Final check
  const finalCount = await prisma.team.count();
  console.log(`\n📊 Final team count: ${finalCount}`);
  
  // Verify no duplicates remain
  const remainingTeams = await prisma.team.findMany({
    where: {
      OR: [
        { name: { contains: 'Aston Villa' } },
        { name: { contains: 'Paris Saint-Germain' } }
      ]
    }
  });
  
  console.log('\n✅ Remaining teams:');
  remainingTeams.forEach(team => {
    console.log(`  - ${team.name}`);
  });
}

fixRemainingDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
