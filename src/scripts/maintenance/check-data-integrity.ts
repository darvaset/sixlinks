// src/scripts/maintenance/check-data-integrity.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class DataIntegrityChecker {
  private issues: string[] = [];
  
  // Check for duplicate players (same name, maybe different spellings)
  async checkDuplicatePlayers() {
    console.log('🔍 Checking for duplicate players...');
    
    const players = await prisma.player.findMany({
      orderBy: { name: 'asc' }
    });

    const potentialDuplicates: Array<{player1: any, player2: any}> = [];
    
    for (let i = 0; i < players.length - 1; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const similarity = this.calculateSimilarity(players[i].name, players[j].name);
        if (similarity > 0.85 && players[i].id !== players[j].id) {
          potentialDuplicates.push({
            player1: players[i],
            player2: players[j]
          });
        }
      }
    }

    if (potentialDuplicates.length > 0) {
      console.log(`\n⚠️  Found ${potentialDuplicates.length} potential duplicates:`);
      potentialDuplicates.forEach(({player1, player2}) => {
        console.log(`   - "${player1.name}" (ID: ${player1.id}) vs "${player2.name}" (ID: ${player2.id})`);
        this.issues.push(`Potential duplicate: ${player1.name} vs ${player2.name}`);
      });
    } else {
      console.log('✅ No duplicate players found');
    }
  }

  // Simple string similarity calculation
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Check for missing data
  async checkMissingData() {
    console.log('\n🔍 Checking for missing data...');
    
    // Players without nationality
    const playersWithoutNationality = await prisma.player.count({
      where: { nationality: null }
    });
    
    // Players without position
    const playersWithoutPosition = await prisma.player.count({
      where: { position: null }
    });
    
    // Teams without country
    const teamsWithoutCountry = await prisma.team.count({
      where: { country: null }
    });
    
    // Teams without league
    const teamsWithoutLeague = await prisma.team.count({
      where: { league: null }
    });

    console.log('\n📊 Missing Data Summary:');
    console.log(`   Players without nationality: ${playersWithoutNationality}`);
    console.log(`   Players without position: ${playersWithoutPosition}`);
    console.log(`   Teams without country: ${teamsWithoutCountry}`);
    console.log(`   Teams without league: ${teamsWithoutLeague}`);

    if (playersWithoutNationality > 0) {
      this.issues.push(`${playersWithoutNationality} players missing nationality`);
    }
  }

  // Check for broken connections
  async checkConnections() {
    console.log('\n🔍 Checking connections...');
    
    // Players with no team history
    const playersWithNoTeams = await prisma.player.findMany({
      where: {
        playerTeams: {
          none: {}
        }
      }
    });

    if (playersWithNoTeams.length > 0) {
      console.log(`\n⚠️  ${playersWithNoTeams.length} players with no team history:`);
      playersWithNoTeams.slice(0, 10).forEach(player => {
        console.log(`   - ${player.name}`);
      });
      if (playersWithNoTeams.length > 10) {
        console.log(`   ... and ${playersWithNoTeams.length - 10} more`);
      }
      this.issues.push(`${playersWithNoTeams.length} players have no team connections`);
    }

    // Check for impossible dates
    const invalidDates = await prisma.playerTeam.findMany({
      where: {
        OR: [
          {
            AND: [
              { startDate: { not: null } },
              { endDate: { not: null } },
              { startDate: { gt: prisma.playerTeam.fields.endDate } }
            ]
          }
        ]
      },
      include: {
        player: true,
        team: true
      }
    });

    if (invalidDates.length > 0) {
      console.log(`\n⚠️  Found ${invalidDates.length} connections with invalid dates`);
      this.issues.push(`${invalidDates.length} connections have invalid date ranges`);
    }
  }

  // Generate report
  async generateReport() {
    console.log('\n📋 Generating integrity report...\n');
    
    const stats = await prisma.$transaction([
      prisma.player.count(),
      prisma.team.count(),
      prisma.manager.count(),
      prisma.playerTeam.count(),
      prisma.playerManager.count()
    ]);

    console.log('📊 Database Statistics:');
    console.log(`   Total Players: ${stats[0]}`);
    console.log(`   Total Teams: ${stats[1]}`);
    console.log(`   Total Managers: ${stats[2]}`);
    console.log(`   Player-Team Connections: ${stats[3]}`);
    console.log(`   Player-Manager Connections: ${stats[4]}`);
    
    // Calculate average connections per player
    const avgConnections = stats[0] > 0 ? (stats[3] / stats[0]).toFixed(2) : 0;
    console.log(`   Avg connections per player: ${avgConnections}`);

    if (this.issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      this.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    } else {
      console.log('\n✅ No major issues found!');
    }

    // Save report to file
    const report = {
      timestamp: new Date().toISOString(),
      stats: {
        players: stats[0],
        teams: stats[1],
        managers: stats[2],
        playerTeamConnections: stats[3],
        playerManagerConnections: stats[4],
        avgConnectionsPerPlayer: avgConnections
      },
      issues: this.issues
    };

    const fs = require('fs');
    const reportPath = `./reports/integrity-report-${new Date().toISOString().split('T')[0]}.json`;
    
    // Create reports directory if it doesn't exist
    if (!fs.existsSync('./reports')) {
      fs.mkdirSync('./reports');
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);
  }

  // Main check function
  async runAllChecks() {
    console.log('🚀 Starting data integrity check...\n');
    
    await this.checkDuplicatePlayers();
    await this.checkMissingData();
    await this.checkConnections();
    await this.generateReport();
    
    console.log('\n✅ Integrity check complete!');
  }
}

// Quick stats function
export async function quickStats() {
  const stats = await prisma.$transaction([
    prisma.player.count(),
    prisma.team.count(),
    prisma.manager.count(),
    prisma.playerTeam.count()
  ]);

  console.log('📊 Quick Database Stats:');
  console.log(`   Players: ${stats[0]}`);
  console.log(`   Teams: ${stats[1]}`);
  console.log(`   Managers: ${stats[2]}`);
  console.log(`   Connections: ${stats[3]}`);
}

// Run checks
if (require.main === module) {
  const checker = new DataIntegrityChecker();
  checker.runAllChecks()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

export { DataIntegrityChecker };