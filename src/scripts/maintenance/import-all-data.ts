// src/scripts/import-all-data.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface PlayerData {
  name: string;
  fullName?: string;
  nationality?: string;
  position?: string;
  birthDate?: string;
  careerHistory?: {
    club: string;
    startYear?: number;
    endYear?: number;
    league?: string;
    loan?: boolean;
  }[];
  managers?: {
    name: string;
    team?: string;
    startYear?: number;
    endYear?: number;
  }[];
}

async function importPlayers() {
  console.log('🚀 Starting data import...');
  
  // List of your JSON files
  const jsonFiles = [
    'manual-players.json',
    'manual-premier-league-players.json',
    'expanded-manual-players.json',
    'fbref-scraped-players.json',
    'wikipedia-scraped-players.json'
  ];

  const allPlayers: PlayerData[] = [];
  const teams = new Map<string, { league?: string; country?: string }>();
  const managers = new Set<string>();

  // Read all JSON files
  for (const fileName of jsonFiles) {
    const filePath = path.join(process.cwd(), fileName);
    if (fs.existsSync(filePath)) {
      console.log(`📄 Reading ${fileName}...`);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const players = Array.isArray(data) ? data : data.players || [];
        allPlayers.push(...players);
        
        // Collect teams and managers
        players.forEach((player: PlayerData) => {
          if (player.careerHistory) {
            player.careerHistory.forEach(career => {
              teams.set(career.club, {
                league: career.league,
                country: getCountryFromLeague(career.league)
              });
            });
          }
          if (player.managers) {
            player.managers.forEach(mgr => managers.add(mgr.name));
          }
        });
      } catch (error) {
        console.error(`❌ Error reading ${fileName}:`, error);
      }
    }
  }

  console.log(`📊 Found ${allPlayers.length} players total`);
  console.log(`🏟️  Found ${teams.size} teams`);
  console.log(`👔 Found ${managers.size} managers`);

  // Import teams first
  console.log('\n📍 Importing teams...');
  const teamMap = new Map<string, number>();
  
  for (const [teamName, teamInfo] of teams) {
    try {
      const team = await prisma.team.upsert({
        where: { name: teamName },
        update: {
          league: teamInfo.league,
          country: teamInfo.country
        },
        create: {
          name: teamName,
          league: teamInfo.league,
          country: teamInfo.country
        }
      });
      teamMap.set(teamName, team.id);
    } catch (error) {
      console.error(`Error importing team ${teamName}:`, error);
    }
  }
  console.log(`✅ Imported ${teamMap.size} teams`);

  // Import managers
  console.log('\n👔 Importing managers...');
  const managerMap = new Map<string, number>();
  
  for (const managerName of managers) {
    try {
      const manager = await prisma.manager.upsert({
        where: { name: managerName },
        update: {},
        create: {
          name: managerName
        }
      });
      managerMap.set(managerName, manager.id);
    } catch (error) {
      console.error(`Error importing manager ${managerName}:`, error);
    }
  }
  console.log(`✅ Imported ${managerMap.size} managers`);

  // Import players with relationships
  console.log('\n⚽ Importing players...');
  let playerCount = 0;
  let connectionCount = 0;

  for (const playerData of allPlayers) {
    try {
      // Parse birth date if provided
      let birthDate: Date | undefined;
      if (playerData.birthDate) {
        birthDate = new Date(playerData.birthDate);
        if (isNaN(birthDate.getTime())) {
          birthDate = undefined;
        }
      }

      // Create or update player
      const player = await prisma.player.upsert({
        where: { name: playerData.name },
        update: {
          fullName: playerData.fullName,
          nationality: playerData.nationality,
          position: playerData.position,
          birthDate: birthDate
        },
        create: {
          name: playerData.name,
          fullName: playerData.fullName,
          nationality: playerData.nationality,
          position: playerData.position,
          birthDate: birthDate
        }
      });
      playerCount++;

      // Create player-team relationships
      if (playerData.careerHistory) {
        for (const career of playerData.careerHistory) {
          const teamId = teamMap.get(career.club);
          if (teamId) {
            const startDate = career.startYear ? new Date(`${career.startYear}-07-01`) : null;
            const endDate = career.endYear ? new Date(`${career.endYear}-06-30`) : null;

            // Check if connection already exists
            const existingConnection = await prisma.playerTeam.findFirst({
              where: {
                playerId: player.id,
                teamId: teamId,
                startDate: startDate
              }
            });

            if (!existingConnection) {
              await prisma.playerTeam.create({
                data: {
                  playerId: player.id,
                  teamId: teamId,
                  startDate: startDate,
                  endDate: endDate,
                  loan: career.loan || false
                }
              });
              connectionCount++;
            }
          }
        }
      }

      // Create player-manager relationships
      if (playerData.managers) {
        for (const mgr of playerData.managers) {
          const managerId = managerMap.get(mgr.name);
          if (managerId) {
            const startDate = mgr.startYear ? new Date(`${mgr.startYear}-07-01`) : null;
            const endDate = mgr.endYear ? new Date(`${mgr.endYear}-06-30`) : null;
            const teamId = mgr.team ? teamMap.get(mgr.team) : null;

            // Check if connection already exists
            const existingConnection = await prisma.playerManager.findFirst({
              where: {
                playerId: player.id,
                managerId: managerId,
                startDate: startDate
              }
            });

            if (!existingConnection) {
              await prisma.playerManager.create({
                data: {
                  playerId: player.id,
                  managerId: managerId,
                  teamId: teamId,
                  startDate: startDate,
                  endDate: endDate
                }
              });
              connectionCount++;
            }
          }
        }
      }

      // Log progress every 10 players
      if (playerCount % 10 === 0) {
        console.log(`  Processed ${playerCount} players...`);
      }
    } catch (error) {
      console.error(`Error importing player ${playerData.name}:`, error);
    }
  }

  console.log(`\n✅ Import complete!`);
  console.log(`   - Players: ${playerCount}`);
  console.log(`   - Connections: ${connectionCount}`);
  console.log(`   - Teams: ${teamMap.size}`);
  console.log(`   - Managers: ${managerMap.size}`);

  // Test the pathfinding
  await testPathfinding();
}

function getCountryFromLeague(league?: string): string | undefined {
  if (!league) return undefined;
  
  const leagueCountryMap: Record<string, string> = {
    'Premier League': 'England',
    'Championship': 'England',
    'La Liga': 'Spain',
    'Serie A': 'Italy',
    'Bundesliga': 'Germany',
    'Ligue 1': 'France',
    'Eredivisie': 'Netherlands',
    'Primeira Liga': 'Portugal',
    'Scottish Premiership': 'Scotland',
    'MLS': 'United States',
    'Liga MX': 'Mexico',
    'Brasileirão': 'Brazil',
    'Argentine Primera División': 'Argentina'
  };
  
  return leagueCountryMap[league];
}

async function testPathfinding() {
  console.log('\n🧪 Testing pathfinding...');
  
  try {
    // Find two players to test
    const players = await prisma.player.findMany({
      take: 2,
      where: {
        playerTeams: {
          some: {}
        }
      }
    });

    if (players.length >= 2) {
      console.log(`Testing path between ${players[0].name} and ${players[1].name}...`);
      
      // Import your pathfinder to test
      const { pathfinder } = await import('../lib/pathfinding');
      const result = await pathfinder.findPath(players[0].id, players[1].id);
      
      if (result.found) {
        console.log(`✅ Found path with ${result.totalSteps} steps!`);
        result.path.forEach((step, index) => {
          console.log(`   Step ${index + 1}: ${step.from.name} → ${step.to.name} (${step.connection.type})`);
        });
      } else {
        console.log('❌ No path found (this might be normal if players are not connected)');
      }
    }
  } catch (error) {
    console.error('Error testing pathfinding:', error);
  }
}

// Run the import
importPlayers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

