// src/scripts/maintenance/update-transfers.ts
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface TransferUpdate {
  playerName: string;
  fromTeam?: string;
  toTeam: string;
  transferDate: Date;
  loan?: boolean;
}

class SmartTransferUpdater {
  private updates: TransferUpdate[] = [];
  private stats = {
    processed: 0,
    updated: 0,
    errors: 0,
    skipped: 0
  };

  // Add known recent transfers (Summer 2024/25 season)
  async addKnownTransfers() {
    // These are well-known transfers you can manually add
    const knownTransfers: TransferUpdate[] = [
      {
        playerName: "Kylian Mbappé",
        fromTeam: "Paris Saint-Germain",
        toTeam: "Real Madrid",
        transferDate: new Date("2024-07-01")
      },
      // Add more known transfers here
    ];

    this.updates.push(...knownTransfers);
  }

  // Process a single transfer
  async processTransfer(transfer: TransferUpdate) {
    try {
      // Find the player
      const player = await prisma.player.findFirst({
        where: { name: transfer.playerName }
      });

      if (!player) {
        console.log(`⚠️  Player not found: ${transfer.playerName}`);
        this.stats.skipped++;
        return;
      }

      // Find the destination team
      const toTeam = await prisma.team.findFirst({
        where: { name: transfer.toTeam }
      });

      if (!toTeam) {
        console.log(`⚠️  Team not found: ${transfer.toTeam}`);
        this.stats.skipped++;
        return;
      }

      // Check current team connection
      const currentConnection = await prisma.playerTeam.findFirst({
        where: {
          playerId: player.id,
          endDate: null
        },
        include: { team: true }
      });

      // If player is already at the destination team, skip
      if (currentConnection && currentConnection.teamId === toTeam.id) {
        console.log(`✓ ${player.name} already at ${toTeam.name}`);
        this.stats.skipped++;
        return;
      }

      // If player has a current team, end that connection
      if (currentConnection) {
        await prisma.playerTeam.update({
          where: { id: currentConnection.id },
          data: { endDate: transfer.transferDate }
        });
        console.log(`  Ended ${player.name}'s connection with ${currentConnection.team.name}`);
      }

      // Create new team connection
      await prisma.playerTeam.create({
        data: {
          playerId: player.id,
          teamId: toTeam.id,
          startDate: transfer.transferDate,
          loan: transfer.loan || false
        }
      });

      console.log(`✅ Updated: ${player.name} → ${toTeam.name}`);
      this.stats.updated++;

    } catch (error) {
      console.error(`❌ Error processing ${transfer.playerName}:`, error);
      this.stats.errors++;
    }
  }

  // Check for players without current teams (retired/free agents)
  async checkFreeAgents() {
    console.log('\n🔍 Checking for free agents/retired players...');
    
    const playersWithoutCurrentTeam = await prisma.player.findMany({
      where: {
        playerTeams: {
          none: {
            endDate: null
          }
        }
      },
      include: {
        playerTeams: {
          orderBy: { startDate: 'desc' },
          take: 1,
          include: { team: true }
        }
      }
    });

    if (playersWithoutCurrentTeam.length > 0) {
      console.log(`\nFound ${playersWithoutCurrentTeam.length} players without current teams:`);
      playersWithoutCurrentTeam.forEach(player => {
        const lastTeam = player.playerTeams[0];
        if (lastTeam) {
          console.log(`  - ${player.name} (last: ${lastTeam.team.name}, ended: ${lastTeam.endDate?.toISOString().split('T')[0]})`);
        } else {
          console.log(`  - ${player.name} (no team history)`);
        }
      });
    }
  }

  // Validate data integrity
  async validateConnections() {
    console.log('\n🔍 Validating connections...');
    
    // Check for overlapping connections
    const players = await prisma.player.findMany({
      include: {
        playerTeams: {
          orderBy: { startDate: 'asc' }
        }
      }
    });

    let issues = 0;
    for (const player of players) {
      for (let i = 0; i < player.playerTeams.length - 1; i++) {
        const current = player.playerTeams[i];
        const next = player.playerTeams[i + 1];
        
        if (current.endDate && next.startDate) {
          if (current.endDate > next.startDate) {
            console.log(`⚠️  Overlapping connections for ${player.name}`);
            issues++;
          }
        }
      }
    }

    if (issues === 0) {
      console.log('✅ No overlapping connections found');
    } else {
      console.log(`⚠️  Found ${issues} overlapping connections`);
    }
  }

  // Main update process
  async run() {
    console.log('🚀 Starting smart transfer update...\n');

    // Add known transfers
    await this.addKnownTransfers();

    // Process all transfers
    for (const transfer of this.updates) {
      this.stats.processed++;
      await this.processTransfer(transfer);
    }

    // Additional checks
    await this.checkFreeAgents();
    await this.validateConnections();

    // Summary
    console.log('\n📊 Update Summary:');
    console.log(`   Processed: ${this.stats.processed}`);
    console.log(`   Updated: ${this.stats.updated}`);
    console.log(`   Skipped: ${this.stats.skipped}`);
    console.log(`   Errors: ${this.stats.errors}`);
  }
}

// Utility to add a single transfer via command line
async function addSingleTransfer(
  playerName: string,
  toTeam: string,
  date?: string,
  loan: boolean = false
) {
  const updater = new SmartTransferUpdater();
  updater.updates.push({
    playerName,
    toTeam,
    transferDate: date ? new Date(date) : new Date(),
    loan
  });
  await updater.run();
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length >= 2) {
    // Command line usage: npm run update-transfer "Player Name" "New Team" "2024-07-01" false
    addSingleTransfer(args[0], args[1], args[2], args[3] === 'true')
      .catch(console.error)
      .finally(() => prisma.$disconnect());
  } else {
    // Run full update
    const updater = new SmartTransferUpdater();
    updater.run()
      .catch(console.error)
      .finally(() => prisma.$disconnect());
  }
}

export { SmartTransferUpdater, addSingleTransfer };