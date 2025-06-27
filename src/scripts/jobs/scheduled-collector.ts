// src/scripts/jobs/scheduled-collector.ts
import { CronJob } from 'cron';
import { SmartDataCollector, isTransferWindow } from '../collection/smart-data-collector';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ScheduledDataCollector {
  private dailyJob?: CronJob;
  private weeklyJob?: CronJob;

  start() {
    console.log('🕐 Starting scheduled data collection...');
    
    if (isTransferWindow()) {
      console.log('📅 Transfer window active - Running daily updates');
      this.startDailyCollection();
    } else {
      console.log('📅 Off-season - Running weekly updates');
      this.startWeeklyCollection();
    }

    // Check monthly if we need to switch schedule
    new CronJob('0 0 1 * *', () => {
      this.adjustSchedule();
    }).start();
  }

  private startDailyCollection() {
    // Stop weekly if running
    if (this.weeklyJob) {
      this.weeklyJob.stop();
      this.weeklyJob = undefined;
    }

    // Run every day at 3 AM
    this.dailyJob = new CronJob('0 3 * * *', async () => {
      console.log('🌅 Running daily collection...');
      await this.runCollection();
    });

    this.dailyJob.start();
    console.log('✅ Daily collection scheduled for 3 AM');
  }

  private startWeeklyCollection() {
    // Stop daily if running
    if (this.dailyJob) {
      this.dailyJob.stop();
      this.dailyJob = undefined;
    }

    // Run every Sunday at 3 AM
    this.weeklyJob = new CronJob('0 3 * * 0', async () => {
      console.log('📅 Running weekly collection...');
      await this.runCollection();
    });

    this.weeklyJob.start();
    console.log('✅ Weekly collection scheduled for Sundays at 3 AM');
  }

  private adjustSchedule() {
    console.log('🔄 Checking if schedule adjustment needed...');
    
    if (isTransferWindow() && !this.dailyJob) {
      console.log('📅 Switching to daily collection (transfer window)');
      this.startDailyCollection();
    } else if (!isTransferWindow() && !this.weeklyJob) {
      console.log('📅 Switching to weekly collection (off-season)');
      this.startWeeklyCollection();
    }
  }

  private async runCollection() {
    const startTime = Date.now();
    
    try {
      const collector = new SmartDataCollector();
      
      // During transfer windows, focus on transfers
      // During off-season, collect everything
      if (isTransferWindow()) {
        await collector.collect({ 
          apis: true,      // Current squads
          wikipedia: false, // Skip historical
          transfers: true   // Focus on transfers
        });
      } else {
        await collector.collect({ 
          apis: true,      // Full collection
          wikipedia: true,  // Historical data
          transfers: true   // Any late transfers
        });
      }

      const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
      console.log(`✅ Collection completed in ${duration} minutes`);

      // Log collection
      await this.logCollection(duration);
      
    } catch (error) {
      console.error('❌ Collection failed:', error);
      // You could add error notification here
    }
  }

  private async logCollection(duration: string) {
    // Simple logging - you could expand this
    console.log(`📝 Logging collection...`);
    
    const stats = await prisma.$transaction([
      prisma.player.count(),
      prisma.team.count(),
      prisma.playerTeam.count()
    ]);

    const log = {
      timestamp: new Date().toISOString(),
      duration: duration,
      isTransferWindow: isTransferWindow(),
      stats: {
        players: stats[0],
        teams: stats[1],
        connections: stats[2]
      }
    };

    // Save to file or database
    const fs = require('fs');
    const logDir = './logs';
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    
    const logFile = `${logDir}/collection-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
  }

  // Manual trigger for testing
  async runNow() {
    console.log('🚀 Running collection manually...');
    await this.runCollection();
  }
}

// For running as a standalone process
if (require.main === module) {
  const scheduler = new ScheduledDataCollector();
  
  // Check for command line args
  const args = process.argv.slice(2);
  
  if (args[0] === 'now') {
    // Run immediately
    scheduler.runNow()
      .then(() => process.exit(0))
      .catch(error => {
        console.error(error);
        process.exit(1);
      });
  } else {
    // Start scheduled jobs
    scheduler.start();
    console.log('📅 Scheduler running. Press Ctrl+C to stop.');
    
    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping scheduler...');
      process.exit(0);
    });
  }
}

export { ScheduledDataCollector };