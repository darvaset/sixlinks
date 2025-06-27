// src/scripts/maintenance/add-indexes.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addIndexes() {
  console.log('🚀 Adding performance indexes...');

  const indexes = [
    'CREATE INDEX IF NOT EXISTS "idx_players_nationality" ON "players"("nationality")',
    'CREATE INDEX IF NOT EXISTS "idx_players_name" ON "players"("name")',
    'CREATE INDEX IF NOT EXISTS "idx_player_teams_player_id" ON "player_teams"("player_id")',
    'CREATE INDEX IF NOT EXISTS "idx_player_teams_team_id" ON "player_teams"("team_id")',
    'CREATE INDEX IF NOT EXISTS "idx_player_teams_dates" ON "player_teams"("player_id", "start_date", "end_date")',
    'CREATE INDEX IF NOT EXISTS "idx_player_managers_player_id" ON "player_managers"("player_id")',
    'CREATE INDEX IF NOT EXISTS "idx_player_managers_manager_id" ON "player_managers"("manager_id")',
    'CREATE INDEX IF NOT EXISTS "idx_teams_name" ON "teams"("name")',
    'CREATE INDEX IF NOT EXISTS "idx_managers_name" ON "managers"("name")'
  ];

  for (const index of indexes) {
    try {
      await prisma.$executeRawUnsafe(index);
      console.log(`✅ Created index: ${index.match(/idx_[^"]+/)?.[0]}`);
    } catch (error) {
      console.error(`❌ Error creating index: ${error}`);
    }
  }

  // Check existing indexes
  const existingIndexes = await prisma.$queryRaw`
    SELECT indexname, tablename 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
    ORDER BY tablename, indexname
  `;

  console.log('\n📊 Current indexes:');
  console.log(existingIndexes);

  console.log('\n✅ Index creation complete!');
}

// Run the script
addIndexes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());