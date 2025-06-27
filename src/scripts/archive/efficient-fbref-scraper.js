// Efficient FBref Scraper - Only target career tables
// Usage: node src/scripts/efficient-fbref-scraper.js

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Smaller test set first
const TARGET_PLAYERS = [
  { name: 'Mason Mount', url: 'https://fbref.com/en/players/3bb7b8b4/Mason-Mount' },
  { name: 'Declan Rice', url: 'https://fbref.com/en/players/b1b0a08d/Declan-Rice' },
  { name: 'Phil Foden', url: 'https://fbref.com/en/players/cd0e4527/Phil-Foden' }
];

async function scrapePlayerCareerOnly(playerInfo) {
  try {
    console.log(`🔍 Scraping: ${playerInfo.name}...`);
    
    const response = await axios.get(playerInfo.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    const playerData = {
      name: playerInfo.name,
      nationality: '',
      position: '',
      careerHistory: []
    };
    
    // 1. Extract basic info more efficiently
    const metaParagraphs = $('div.meta p, .player_name + p, h1 + p').text();
    console.log(`   📋 Basic info: ${metaParagraphs.substring(0, 100)}...`);
    
    // Extract nationality and position from meta text
    if (metaParagraphs.includes('Position:')) {
      const posMatch = metaParagraphs.match(/Position:\s*([^•\n]+)/);
      if (posMatch) playerData.position = posMatch[1].trim();
    }
    
    // 2. Target ONLY the career/club stats table
    let careerTableFound = false;
    
    $('table').each((i, table) => {
      if (careerTableFound) return; // Stop after finding the right table
      
      const $table = $(table);
      const tableId = $table.attr('id') || '';
      const caption = $table.find('caption').text().toLowerCase();
      
      // Look specifically for club career table
      if (tableId.includes('stats_standard') || 
          caption.includes('club') ||
          (caption.includes('standard') && caption.includes('stats'))) {
        
        console.log(`   🎯 Found career table: ${tableId || caption}`);
        careerTableFound = true;
        
        // Get headers to understand table structure
        const headers = [];
        $table.find('thead tr').last().find('th').each((i, th) => {
          headers.push($(th).text().trim());
        });
        
        console.log(`   📝 Headers: Season | Squad | ${headers.slice(2, 5).join(' | ')}...`);
        
        // Extract career data
        $table.find('tbody tr').each((rowIndex, row) => {
          const $row = $(row);
          const cells = [];
          
          $row.find('td, th').each((cellIndex, cell) => {
            cells.push($(cell).text().trim());
          });
          
          if (cells.length >= 2) {
            const season = cells[0] || '';
            const squad = cells[1] || '';
            const comp = cells[2] || '';
            
            // Only process rows that look like career entries
            if (season.match(/\d{4}-\d{2}/) && 
                squad && 
                squad.length > 1 && 
                squad.length < 30 &&
                !squad.includes('Squad')) {
              
              const yearMatch = season.match(/(\d{4})-(\d{2})/);
              if (yearMatch) {
                const startYear = parseInt(yearMatch[1]);
                const endYear = parseInt('20' + yearMatch[2]);
                
                // Avoid duplicates
                const exists = playerData.careerHistory.some(entry => 
                  entry.club === squad && entry.startYear === startYear
                );
                
                if (!exists) {
                  playerData.careerHistory.push({
                    club: squad.trim(),
                    league: comp.trim() || 'Unknown',
                    startYear: startYear,
                    endYear: endYear,
                    season: season
                  });
                  
                  console.log(`   ✅ ${squad} (${startYear}-${endYear})`);
                }
              }
            }
          }
        });
      }
    });
    
    if (!careerTableFound) {
      console.log(`   ❌ No career table found for ${playerInfo.name}`);
      return null;
    }
    
    if (playerData.careerHistory.length === 0) {
      console.log(`   ❌ No career data extracted for ${playerInfo.name}`);
      return null;
    }
    
    // Sort by year
    playerData.careerHistory.sort((a, b) => a.startYear - b.startYear);
    
    console.log(`   ✅ SUCCESS: ${playerData.careerHistory.length} clubs found`);
    console.log(`   📋 Career: ${playerData.careerHistory.map(c => c.club).join(' → ')}`);
    
    return playerData;
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function testEfficientScraping() {
  console.log('🧪 Testing efficient FBref scraping...');
  
  const results = [];
  
  for (const playerInfo of TARGET_PLAYERS) {
    const playerData = await scrapePlayerCareerOnly(playerInfo);
    
    if (playerData) {
      results.push(playerData);
    }
    
    console.log('⏳ Waiting 2 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  if (results.length > 0) {
    const outputPath = 'efficient-fbref-test.json';
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    console.log(`🎉 Efficient scraping test completed!`);
    console.log(`✅ Successfully scraped ${results.length}/${TARGET_PLAYERS.length} players`);
    console.log(`📁 Data saved to: ${outputPath}`);
    
    // Show summary
    const totalClubs = new Set();
    results.forEach(player => {
      player.careerHistory.forEach(career => {
        totalClubs.add(career.club);
      });
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`- Players: ${results.length}`);
    console.log(`- Total career entries: ${results.reduce((sum, p) => sum + p.careerHistory.length, 0)}`);
    console.log(`- Unique clubs: ${totalClubs.size}`);
    console.log(`- Clubs: ${Array.from(totalClubs).join(', ')}`);
    
    if (results.length >= 2) {
      console.log(`\n✅ Scraping logic works! Ready for full run.`);
      console.log(`Run: node src/scripts/efficient-fbref-scraper.js --full`);
    }
  } else {
    console.log(`❌ No players scraped successfully. Need to adjust approach.`);
  }
  
  return results;
}

async function runFullScraping() {
  // Expanded list for full run
  const FULL_PLAYER_LIST = [
    { name: 'Mason Mount', url: 'https://fbref.com/en/players/3bb7b8b4/Mason-Mount' },
    { name: 'Declan Rice', url: 'https://fbref.com/en/players/b1b0a08d/Declan-Rice' },
    { name: 'Bukayo Saka', url: 'https://fbref.com/en/players/bc7dc64d/Bukayo-Saka' },
    { name: 'Phil Foden', url: 'https://fbref.com/en/players/cd0e4527/Phil-Foden' },
    { name: 'Marcus Rashford', url: 'https://fbref.com/en/players/a1d5bd55/Marcus-Rashford' },
    { name: 'Bruno Fernandes', url: 'https://fbref.com/en/players/507c8bb1/Bruno-Fernandes' },
    { name: 'Son Heung-min', url: 'https://fbref.com/en/players/1df79dab/Son-Heung-min' },
    { name: 'Riyad Mahrez', url: 'https://fbref.com/en/players/2a1ba061/Riyad-Mahrez' }
  ];
  
  console.log(`🚀 Running full efficient scraping for ${FULL_PLAYER_LIST.length} players...`);
  
  const results = [];
  
  for (const playerInfo of FULL_PLAYER_LIST) {
    const playerData = await scrapePlayerCareerOnly(playerInfo);
    
    if (playerData) {
      results.push(playerData);
    }
    
    console.log('⏳ Waiting 3 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  const outputPath = 'fbref-efficient-scraped.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log(`\n🎉 Full scraping completed!`);
  console.log(`✅ Successfully scraped ${results.length}/${FULL_PLAYER_LIST.length} players`);
  console.log(`📁 Data saved to: ${outputPath}`);
  
  if (results.length > 0) {
    console.log(`\n✅ Ready to import! Run:`);
    console.log(`node src/scripts/import-scraped-data.js fbref-efficient-scraped.json`);
  }
  
  return results;
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--full')) {
    runFullScraping().catch(console.error);
  } else {
    testEfficientScraping().catch(console.error);
  }
}

module.exports = { scrapePlayerCareerOnly, testEfficientScraping };
