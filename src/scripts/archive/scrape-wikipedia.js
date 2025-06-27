// Wikipedia Player Data Scraper
// Usage: node src/scripts/scrape-wikipedia.js

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Target players - focus on "hub" players with many connections
const TARGET_PLAYERS = [
  // Barcelona legends (lots of connections)
  'Xavi',
  'Andrés_Iniesta', 
  'Carles_Puyol',
  'Dani_Alves',
  'Gerard_Piqué',
  'Jordi_Alba',
  'Luis_Suárez_(footballer,_born_1987)',
  
  // Real Madrid legends
  'Iker_Casillas',
  'Marcelo_(footballer,_born_1988)',
  'Karim_Benzema',
  'Toni_Kroos',
  'Gareth_Bale',
  'Raphaël_Varane',
  
  // Premier League stars
  'Mohamed_Salah',
  'Sadio_Mané',
  'Harry_Kane',
  'Raheem_Sterling',
  'N\'Golo_Kanté',
  'Paul_Pogba',
  
  // Serie A/Bundesliga connections
  'Robert_Lewandowski',
  'Thomas_Müller',
  'Manuel_Neuer',
  'Gianluigi_Donnarumma',
  'Paulo_Dybala',
  
  // International stars with many club moves
  'Romelu_Lukaku',
  'Eden_Hazard',
  'Antoine_Griezmann',
  'Diego_Godín',
  'Arturo_Vidal',
  
  // Historical legends for broader connections
  'Ronaldinho',
  'Kaká',
  'Andrea_Pirlo',
  'Francesco_Totti',
  'Thierry_Henry',
  'David_Beckham'
];

async function scrapePlayerData(playerName) {
  try {
    const url = `https://en.wikipedia.org/wiki/${playerName}`;
    console.log(`Scraping: ${playerName}...`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'SixLinks Football Game Data Collector (Educational Use)'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract basic player info
    const playerData = {
      name: $('.fn').first().text() || playerName.replace(/_/g, ' '),
      fullName: '',
      nationality: '',
      position: '',
      birthDate: '',
      careerHistory: [],
      internationalHistory: []
    };
    
    // Extract nationality from infobox
    $('.infobox tr').each((i, row) => {
      const label = $(row).find('th').text().trim();
      const value = $(row).find('td').text().trim();
      
      if (label.includes('Born')) {
        // Extract birth date
        const dateMatch = value.match(/\d{1,2}\s\w+\s\d{4}/);
        if (dateMatch) {
          playerData.birthDate = dateMatch[0];
        }
      }
      
      if (label.includes('Position')) {
        playerData.position = value.split('(')[0].trim();
      }
      
      if (label.includes('nationality') || label.includes('National team')) {
        // Extract nationality from flag or text
        const nationalityMatch = value.match(/[A-Z][a-zA-Z\s]+/);
        if (nationalityMatch) {
          playerData.nationality = nationalityMatch[0].trim();
        }
      }
    });
    
    // Extract career history from career statistics table
    $('table.wikitable').each((i, table) => {
      const caption = $(table).find('caption').text();
      
      if (caption.includes('Career statistics') || caption.includes('Club career')) {
        $(table).find('tbody tr').each((j, row) => {
          const cells = $(row).find('td');
          if (cells.length >= 4) {
            const season = $(cells[0]).text().trim();
            const club = $(cells[1]).text().trim();
            const league = $(cells[2]).text().trim();
            
            // Only add if we have real data (not headers or totals)
            if (season && club && !season.includes('Total') && !season.includes('Career')) {
              // Parse season years
              const yearMatch = season.match(/(\d{4})[–-](\d{2,4})/);
              if (yearMatch) {
                const startYear = parseInt(yearMatch[1]);
                const endYear = yearMatch[2].length === 2 
                  ? 2000 + parseInt(yearMatch[2]) 
                  : parseInt(yearMatch[2]);
                
                playerData.careerHistory.push({
                  club: club.replace(/\[.*?\]/g, '').trim(), // Remove footnotes
                  league: league.replace(/\[.*?\]/g, '').trim(),
                  startYear,
                  endYear,
                  season
                });
              }
            }
          }
        });
      }
      
      // Extract international career
      if (caption.includes('International career') || caption.includes('International goals')) {
        $(table).find('tbody tr').each((j, row) => {
          const cells = $(row).find('td');
          if (cells.length >= 2) {
            const years = $(cells[0]).text().trim();
            const team = $(cells[1]).text().trim();
            const caps = $(cells[2]).text().trim();
            
            if (years && team && !years.includes('Total')) {
              const yearMatch = years.match(/(\d{4})[–-](\d{4})?/);
              if (yearMatch) {
                playerData.internationalHistory.push({
                  team: team.replace(/\[.*?\]/g, '').trim(),
                  startYear: parseInt(yearMatch[1]),
                  endYear: yearMatch[2] ? parseInt(yearMatch[2]) : null,
                  caps: parseInt(caps) || 0
                });
              }
            }
          }
        });
      }
    });
    
    // Wait to be respectful to Wikipedia
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return playerData;
    
  } catch (error) {
    console.error(`Error scraping ${playerName}:`, error.message);
    return null;
  }
}

async function scrapeAllPlayers() {
  const allPlayerData = [];
  
  for (const playerName of TARGET_PLAYERS) {
    const playerData = await scrapePlayerData(playerName);
    if (playerData && playerData.careerHistory.length > 0) {
      allPlayerData.push(playerData);
      console.log(`✅ ${playerData.name}: ${playerData.careerHistory.length} career entries`);
    } else {
      console.log(`❌ Failed to get data for ${playerName}`);
    }
  }
  
  // Save to JSON file
  const outputPath = 'scraped-players.json';
  fs.writeFileSync(outputPath, JSON.stringify(allPlayerData, null, 2));
  console.log(`\n🎉 Scraped ${allPlayerData.length} players successfully!`);
  console.log(`Data saved to: ${outputPath}`);
  
  // Generate summary stats
  const totalCareerEntries = allPlayerData.reduce((sum, p) => sum + p.careerHistory.length, 0);
  const uniqueClubs = new Set();
  allPlayerData.forEach(p => {
    p.careerHistory.forEach(c => uniqueClubs.add(c.club));
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`- Players: ${allPlayerData.length}`);
  console.log(`- Career entries: ${totalCareerEntries}`);
  console.log(`- Unique clubs: ${uniqueClubs.size}`);
  
  return allPlayerData;
}

// Install dependencies first: npm install axios cheerio
// Then run: node src/scripts/scrape-wikipedia.js
if (require.main === module) {
  scrapeAllPlayers().catch(console.error);
}

module.exports = { scrapePlayerData, scrapeAllPlayers };
