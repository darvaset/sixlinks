// FBref.com Player Data Scraper
// FBref has more structured data than Wikipedia
// Usage: node src/scripts/fbref-scraper.js

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Target players with their FBref URLs (easier to get right)
const TARGET_PLAYERS = [
  { name: 'Mason Mount', url: 'https://fbref.com/en/players/3bb7b8b4/Mason-Mount' },
  { name: 'Declan Rice', url: 'https://fbref.com/en/players/b1b0a08d/Declan-Rice' },
  { name: 'Bukayo Saka', url: 'https://fbref.com/en/players/bc7dc64d/Bukayo-Saka' },
  { name: 'Phil Foden', url: 'https://fbref.com/en/players/cd0e4527/Phil-Foden' },
  { name: 'Jadon Sancho', url: 'https://fbref.com/en/players/dbf053da/Jadon-Sancho' },
  { name: 'Marcus Rashford', url: 'https://fbref.com/en/players/a1d5bd55/Marcus-Rashford' },
  { name: 'Bruno Fernandes', url: 'https://fbref.com/en/players/507c8bb1/Bruno-Fernandes' },
  { name: 'Rúben Dias', url: 'https://fbref.com/en/players/c1b6b71b/Ruben-Dias' },
  { name: 'João Cancelo', url: 'https://fbref.com/en/players/50d396fe/Joao-Cancelo' },
  { name: 'Riyad Mahrez', url: 'https://fbref.com/en/players/2a1ba061/Riyad-Mahrez' },
  { name: 'Son Heung-min', url: 'https://fbref.com/en/players/1df79dab/Son-Heung-min' },
  { name: 'Sergio Reguilón', url: 'https://fbref.com/en/players/a9b12c6e/Sergio-Reguilon' },
  { name: 'Federico Chiesa', url: 'https://fbref.com/en/players/64b2b4b1/Federico-Chiesa' },
  { name: 'Nicolò Barella', url: 'https://fbref.com/en/players/0bf3ca14/Nicolo-Barella' },
  { name: 'Lautaro Martínez', url: 'https://fbref.com/en/players/8b48dd44/Lautaro-Martinez' }
];

async function scrapeFBrefPlayer(playerInfo) {
  try {
    console.log(`🔍 Scraping: ${playerInfo.name}...`);
    console.log(`   URL: ${playerInfo.url}`);
    
    const response = await axios.get(playerInfo.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    
    // Initialize player data
    const playerData = {
      name: playerInfo.name,
      fullName: '',
      nationality: '',
      position: '',
      birthDate: '',
      careerHistory: []
    };
    
    // Extract basic info from the player header/meta info
    const metaInfo = $('.meta div p').text();
    console.log(`   📋 Meta info: ${metaInfo}`);
    
    // Extract from info box or player details
    $('p').each((i, element) => {
      const text = $(element).text();
      
      if (text.includes('Position:')) {
        const positionMatch = text.match(/Position:\s*([^,\n]+)/);
        if (positionMatch) {
          playerData.position = positionMatch[1].trim();
        }
      }
      
      if (text.includes('Born:')) {
        const birthMatch = text.match(/Born:\s*([^,\n]+)/);
        if (birthMatch) {
          playerData.birthDate = birthMatch[1].trim();
        }
      }
      
      if (text.includes('National Team:') || text.includes('Citizenship:')) {
        const nationalityMatch = text.match(/(?:National Team|Citizenship):\s*([^,\n]+)/);
        if (nationalityMatch) {
          playerData.nationality = nationalityMatch[1].trim();
        }
      }
    });
    
    // Look for career/transfer history tables
    $('table').each((tableIndex, table) => {
      const $table = $(table);
      const tableId = $table.attr('id') || '';
      const caption = $table.find('caption').text().toLowerCase();
      
      console.log(`   📊 Table ${tableIndex}: ID="${tableId}", Caption="${caption}"`);
      
      // Look for tables that might contain career info
      if (tableId.includes('stats') || 
          caption.includes('stats') || 
          caption.includes('season') ||
          caption.includes('club')) {
        
        console.log(`   🎯 Potential career table found!`);
        
        // Extract headers
        const headers = [];
        $table.find('thead tr').last().find('th').each((i, th) => {
          headers.push($(th).text().trim());
        });
        
        console.log(`   📝 Headers: [${headers.slice(0, 5).join(', ')}...]`);
        
        // Extract data rows
        $table.find('tbody tr').each((rowIndex, row) => {
          const $row = $(row);
          const cells = [];
          
          $row.find('td, th').each((cellIndex, cell) => {
            cells.push($(cell).text().trim());
          });
          
          if (cells.length >= 3) {
            console.log(`   📄 Row ${rowIndex}: [${cells.slice(0, 5).join(' | ')}...]`);
            
            // Try to extract season, club, and league
            const season = cells[0] || '';
            const squad = cells[1] || '';
            const comp = cells[2] || '';
            
            // Check if this looks like a career entry
            if (season.match(/\d{4}-\d{2}/) && squad && squad.length > 1) {
              // Parse season years
              const yearMatch = season.match(/(\d{4})-(\d{2})/);
              if (yearMatch) {
                const startYear = parseInt(yearMatch[1]);
                const endYear = parseInt('20' + yearMatch[2]);
                
                // Clean squad name
                const cleanSquad = squad.replace(/\s+/g, ' ').trim();
                
                if (cleanSquad.length > 1 && cleanSquad.length < 50) {
                  playerData.careerHistory.push({
                    club: cleanSquad,
                    league: comp || 'Unknown',
                    startYear: startYear,
                    endYear: endYear,
                    season: season
                  });
                  
                  console.log(`   ✅ Added: ${cleanSquad} (${startYear}-${endYear})`);
                }
              }
            }
          }
        });
      }
    });
    
    // Remove duplicates and sort by year
    const uniqueCareer = [];
    playerData.careerHistory.forEach(entry => {
      const isDuplicate = uniqueCareer.some(existing => 
        existing.club === entry.club && existing.startYear === entry.startYear
      );
      if (!isDuplicate) {
        uniqueCareer.push(entry);
      }
    });
    
    playerData.careerHistory = uniqueCareer.sort((a, b) => a.startYear - b.startYear);
    
    console.log(`   ✅ Extracted ${playerData.careerHistory.length} career entries for ${playerData.name}`);
    
    if (playerData.careerHistory.length > 0) {
      console.log(`   📋 Career: ${playerData.careerHistory.map(c => c.club).join(' → ')}`);
      return playerData;
    } else {
      console.log(`   ❌ No career data found for ${playerData.name}`);
      return null;
    }
    
  } catch (error) {
    console.error(`   ❌ Error scraping ${playerInfo.name}: ${error.message}`);
    return null;
  }
}

async function scrapeFBrefPlayers() {
  const allPlayerData = [];
  
  console.log(`🚀 Starting FBref scraping for ${TARGET_PLAYERS.length} players...`);
  
  for (const playerInfo of TARGET_PLAYERS) {
    const playerData = await scrapeFBrefPlayer(playerInfo);
    
    if (playerData) {
      allPlayerData.push(playerData);
    }
    
    // Be respectful with delays
    console.log('⏳ Waiting 3 seconds before next request...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Save results
  const outputPath = 'fbref-scraped-players.json';
  fs.writeFileSync(outputPath, JSON.stringify(allPlayerData, null, 2));
  
  console.log(`\n🎉 FBref scraping completed!`);
  console.log(`📁 Successfully scraped ${allPlayerData.length} players`);
  console.log(`💾 Data saved to: ${outputPath}`);
  
  if (allPlayerData.length > 0) {
    // Generate summary
    const totalCareerEntries = allPlayerData.reduce((sum, p) => sum + p.careerHistory.length, 0);
    const uniqueClubs = new Set();
    
    allPlayerData.forEach(p => {
      p.careerHistory.forEach(c => uniqueClubs.add(c.club));
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`- Players: ${allPlayerData.length}`);
    console.log(`- Career entries: ${totalCareerEntries}`);
    console.log(`- Unique clubs: ${uniqueClubs.size}`);
    
    console.log(`\n🏆 Clubs found:`);
    const clubList = Array.from(uniqueClubs).sort();
    clubList.slice(0, 15).forEach(club => console.log(`  - ${club}`));
    
    console.log(`\n✅ Ready to import! Run:`);
    console.log(`node src/scripts/import-scraped-data.js fbref-scraped-players.json`);
  }
  
  return allPlayerData;
}

// Quick test function for a single player
async function testSinglePlayer() {
  console.log('🧪 Testing single player scraping...');
  const testPlayer = { 
    name: 'Mason Mount', 
    url: 'https://fbref.com/en/players/3bb7b8b4/Mason-Mount' 
  };
  
  const result = await scrapeFBrefPlayer(testPlayer);
  if (result) {
    console.log('\n✅ Test successful! Full scraping should work.');
    console.log(`Found ${result.careerHistory.length} career entries for ${result.name}`);
  } else {
    console.log('\n❌ Test failed. Need to adjust scraping logic.');
  }
}

// Run based on command line argument
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--test')) {
    testSinglePlayer().catch(console.error);
  } else {
    scrapeFBrefPlayers().catch(console.error);
  }
}

module.exports = { scrapeFBrefPlayer, scrapeFBrefPlayers };
