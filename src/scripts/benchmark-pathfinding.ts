// src/scripts/benchmark-pathfinding.ts
import { PrismaClient } from '@prisma/client';
import { pathfinder } from '../lib/pathfinding';

const prisma = new PrismaClient();

async function benchmarkPathfinding() {
  console.log('⚡ Benchmarking pathfinding performance\n');

  // Test cases of varying difficulty
  const testCases = [
    { from: 'Harry Kane', to: 'Bukayo Saka', expected: '1 (England)' },
    { from: 'Mohamed Salah', to: 'Kevin De Bruyne', expected: '1-2 (Liverpool/City/Belgium)' },
    { from: 'Lionel Messi', to: 'Cristiano Ronaldo', expected: '2-3 (via teammates)' },
    { from: 'Harry Kane', to: 'Lionel Messi', expected: '3-4 (international)' }
  ];

  const results = [];

  for (const test of testCases) {
    const fromPlayer = await prisma.player.findFirst({
      where: { name: { contains: test.from, mode: 'insensitive' } }
    });
    
    const toPlayer = await prisma.player.findFirst({
      where: { name: { contains: test.to, mode: 'insensitive' } }
    });

    if (!fromPlayer || !toPlayer) continue;

    console.log(`\n🔍 ${test.from} → ${test.to}`);
    console.log(`Expected: ${test.expected} steps`);

    const start = Date.now();
    const result = await pathfinder.findPath(fromPlayer.id, toPlayer.id);
    const duration = Date.now() - start;

    if (result.found) {
      console.log(`✅ Found: ${result.totalSteps} steps in ${duration}ms`);
      
      // Show the path
      result.path.forEach((step, i) => {
        console.log(`   ${i + 1}. ${step.connection.type}: ${step.connection.description}`);
      });
    } else {
      console.log(`❌ Not found after ${duration}ms`);
    }

    results.push({
      test: `${test.from} → ${test.to}`,
      found: result.found,
      steps: result.totalSteps,
      time: duration
    });
  }

  // Summary
  console.log('\n📊 Performance Summary:');
  console.log('┌─────────────────────────────────┬───────┬───────┬──────────┐');
  console.log('│ Path                            │ Found │ Steps │ Time     │');
  console.log('├─────────────────────────────────┼───────┼───────┼──────────┤');
  
  results.forEach(r => {
    const path = r.test.padEnd(31);
    const found = r.found ? '✅' : '❌';
    const steps = r.found ? r.steps.toString().padEnd(5) : '-    ';
    const time = `${r.time}ms`.padEnd(8);
    console.log(`│ ${path} │   ${found}  │ ${steps} │ ${time} │`);
  });
  
  console.log('└─────────────────────────────────┴───────┴───────┴──────────┘');

  const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
  console.log(`\nAverage query time: ${avgTime.toFixed(0)}ms`);

  console.log('\n💡 For comparison, Neo4j would handle these in:');
  console.log('   - 1-step paths: ~10ms');
  console.log('   - 2-3 step paths: ~20-50ms');
  console.log('   - 4-6 step paths: ~50-100ms');
  console.log(`   - Your average: ${avgTime.toFixed(0)}ms → Neo4j estimate: ~35ms (${(avgTime/35).toFixed(0)}x faster)`);
}

benchmarkPathfinding()
  .catch(console.error)
  .finally(() => prisma.$disconnect());