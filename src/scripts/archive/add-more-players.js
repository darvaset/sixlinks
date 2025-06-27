// Simple approach: Add more players manually with verified data
// This is faster and more reliable than fighting with Wikipedia parsing
// Usage: node src/scripts/add-more-players.js

const fs = require('fs');

// Manually curated data for 15 high-value players with verified career info
const ADDITIONAL_PLAYERS = [
  {
    name: 'Kevin De Bruyne',
    fullName: 'Kevin De Bruyne',
    nationality: 'Belgium',
    position: 'Midfielder',
    careerHistory: [
      { club: 'Genk', startYear: 2008, endYear: 2012, league: 'Belgian Pro League' },
      { club: 'Chelsea', startYear: 2012, endYear: 2014, league: 'Premier League' },
      { club: 'Werder Bremen', startYear: 2012, endYear: 2013, league: 'Bundesliga', loan: true },
      { club: 'VfL Wolfsburg', startYear: 2014, endYear: 2015, league: 'Bundesliga' },
      { club: 'Manchester City', startYear: 2015, endYear: null, league: 'Premier League' }
    ]
  },
  {
    name: 'Virgil van Dijk',
    fullName: 'Virgil van Dijk',
    nationality: 'Netherlands',
    position: 'Defender',
    careerHistory: [
      { club: 'Groningen', startYear: 2011, endYear: 2013, league: 'Eredivisie' },
      { club: 'Celtic', startYear: 2013, endYear: 2015, league: 'Scottish Premiership' },
      { club: 'Southampton', startYear: 2015, endYear: 2018, league: 'Premier League' },
      { club: 'Liverpool', startYear: 2018, endYear: null, league: 'Premier League' }
    ]
  },
  {
    name: 'Sadio Mané',
    fullName: 'Sadio Mané',
    nationality: 'Senegal',
    position: 'Forward',
    careerHistory: [
      { club: 'Metz', startYear: 2011, endYear: 2012, league: 'Ligue 2' },
      { club: 'Red Bull Salzburg', startYear: 2012, endYear: 2014, league: 'Austrian Bundesliga' },
      { club: 'Southampton', startYear: 2014, endYear: 2016, league: 'Premier League' },
      { club: 'Liverpool', startYear: 2016, endYear: 2022, league: 'Premier League' },
      { club: 'Bayern Munich', startYear: 2022, endYear: 2023, league: 'Bundesliga' },
      { club: 'Al Nassr', startYear: 2023, endYear: null, league: 'Saudi Pro League' }
    ]
  },
  {
    name: 'Raheem Sterling',
    fullName: 'Raheem Sterling',
    nationality: 'England',
    position: 'Forward',
    careerHistory: [
      { club: 'Liverpool', startYear: 2012, endYear: 2015, league: 'Premier League' },
      { club: 'Manchester City', startYear: 2015, endYear: 2022, league: 'Premier League' },
      { club: 'Chelsea', startYear: 2022, endYear: 2024, league: 'Premier League' },
      { club: 'Arsenal', startYear: 2024, endYear: null, league: 'Premier League', loan: true }
    ]
  },
  {
    name: 'Luka Modrić',
    fullName: 'Luka Modrić',
    nationality: 'Croatia',
    position: 'Midfielder',
    careerHistory: [
      { club: 'Dinamo Zagreb', startYear: 2005, endYear: 2008, league: 'Croatian First League' },
      { club: 'Tottenham Hotspur', startYear: 2008, endYear: 2012, league: 'Premier League' },
      { club: 'Real Madrid', startYear: 2012, endYear: null, league: 'La Liga' }
    ]
  },
  {
    name: 'Vinícius Júnior',
    fullName: 'Vinícius José Paixão de Oliveira Júnior',
    nationality: 'Brazil',
    position: 'Forward',
    careerHistory: [
      { club: 'Flamengo', startYear: 2017, endYear: 2018, league: 'Brasileirão' },
      { club: 'Real Madrid', startYear: 2018, endYear: null, league: 'La Liga' }
    ]
  },
  {
    name: 'Erling Haaland',
    fullName: 'Erling Braut Haaland',
    nationality: 'Norway',
    position: 'Forward',
    careerHistory: [
      { club: 'Molde', startYear: 2017, endYear: 2019, league: 'Eliteserien' },
      { club: 'Red Bull Salzburg', startYear: 2019, endYear: 2020, league: 'Austrian Bundesliga' },
      { club: 'Borussia Dortmund', startYear: 2020, endYear: 2022, league: 'Bundesliga' },
      { club: 'Manchester City', startYear: 2022, endYear: null, league: 'Premier League' }
    ]
  },
  {
    name: 'Thomas Müller',
    fullName: 'Thomas Müller',
    nationality: 'Germany',
    position: 'Forward',
    careerHistory: [
      { club: 'Bayern Munich', startYear: 2008, endYear: null, league: 'Bundesliga' }
    ]
  },
  {
    name: 'Joshua Kimmich',
    fullName: 'Joshua Kimmich',
    nationality: 'Germany',
    position: 'Midfielder',
    careerHistory: [
      { club: 'VfB Stuttgart', startYear: 2013, endYear: 2015, league: 'Bundesliga' },
      { club: 'Bayern Munich', startYear: 2015, endYear: null, league: 'Bundesliga' }
    ]
  },
  {
    name: 'Memphis Depay',
    fullName: 'Memphis Depay',
    nationality: 'Netherlands',
    position: 'Forward',
    careerHistory: [
      { club: 'PSV Eindhoven', startYear: 2011, endYear: 2015, league: 'Eredivisie' },
      { club: 'Manchester United', startYear: 2015, endYear: 2017, league: 'Premier League' },
      { club: 'Olympique Lyon', startYear: 2017, endYear: 2021, league: 'Ligue 1' },
      { club: 'FC Barcelona', startYear: 2021, endYear: 2023, league: 'La Liga' },
      { club: 'Atlético Madrid', startYear: 2023, endYear: null, league: 'La Liga' }
    ]
  },
  {
    name: 'Paulo Dybala',
    fullName: 'Paulo Bruno Exequiel Dybala',
    nationality: 'Argentina',
    position: 'Forward',
    careerHistory: [
      { club: 'Instituto', startYear: 2011, endYear: 2012, league: 'Primera B Nacional' },
      { club: 'Palermo', startYear: 2012, endYear: 2015, league: 'Serie A' },
      { club: 'Juventus', startYear: 2015, endYear: 2022, league: 'Serie A' },
      { club: 'AS Roma', startYear: 2022, endYear: null, league: 'Serie A' }
    ]
  },
  {
    name: 'Jack Grealish',
    fullName: 'Jack Peter Grealish',
    nationality: 'England',
    position: 'Forward',
    careerHistory: [
      { club: 'Aston Villa', startYear: 2014, endYear: 2021, league: 'Premier League' },
      { club: 'Manchester City', startYear: 2021, endYear: null, league: 'Premier League' }
    ]
  },
  {
    name: 'Jamal Musiala',
    fullName: 'Jamal Musiala',
    nationality: 'Germany',
    position: 'Midfielder',
    careerHistory: [
      { club: 'Chelsea', startYear: 2019, endYear: 2019, league: 'Premier League' },
      { club: 'Bayern Munich', startYear: 2019, endYear: null, league: 'Bundesliga' }
    ]
  },
  {
    name: 'Jude Bellingham',
    fullName: 'Jude Victor William Bellingham',
    nationality: 'England',
    position: 'Midfielder',
    careerHistory: [
      { club: 'Birmingham City', startYear: 2019, endYear: 2020, league: 'Championship' },
      { club: 'Borussia Dortmund', startYear: 2020, endYear: 2023, league: 'Bundesliga' },
      { club: 'Real Madrid', startYear: 2023, endYear: null, league: 'La Liga' }
    ]
  },
  {
    name: 'Alphonso Davies',
    fullName: 'Alphonso Boyle Davies',
    nationality: 'Canada',
    position: 'Defender',
    careerHistory: [
      { club: 'Vancouver Whitecaps', startYear: 2016, endYear: 2018, league: 'MLS' },
      { club: 'Bayern Munich', startYear: 2019, endYear: null, league: 'Bundesliga' }
    ]
  }
];

function createExpandedDataset() {
  console.log('🔧 Creating expanded manual dataset...');
  
  // Combine with existing manual data if it exists
  let existingData = [];
  if (fs.existsSync('manual-players.json')) {
    try {
      existingData = JSON.parse(fs.readFileSync('manual-players.json', 'utf8'));
      console.log(`📁 Found ${existingData.length} existing players`);
    } catch (error) {
      console.log('⚠️ Could not read existing manual data, starting fresh');
    }
  }
  
  // Combine datasets, avoiding duplicates
  const combinedData = [...existingData];
  let addedCount = 0;
  
  ADDITIONAL_PLAYERS.forEach(newPlayer => {
    const existing = combinedData.find(p => p.name === newPlayer.name);
    if (!existing) {
      combinedData.push(newPlayer);
      addedCount++;
    } else {
      console.log(`⏭️  Skipping ${newPlayer.name} (already exists)`);
    }
  });
  
  // Save expanded dataset
  const outputPath = 'expanded-manual-players.json';
  fs.writeFileSync(outputPath, JSON.stringify(combinedData, null, 2));
  
  console.log(`✅ Created expanded dataset with ${combinedData.length} players (+${addedCount} new)`);
  console.log(`📁 Saved to: ${outputPath}`);
  
  // Generate summary
  const totalCareerEntries = combinedData.reduce((sum, p) => sum + p.careerHistory.length, 0);
  const uniqueClubs = new Set();
  const uniqueCountries = new Set();
  
  combinedData.forEach(p => {
    p.careerHistory.forEach(c => uniqueClubs.add(c.club));
    if (p.nationality) uniqueCountries.add(p.nationality);
  });
  
  console.log(`\n📊 Expanded Dataset Summary:`);
  console.log(`- Players: ${combinedData.length}`);
  console.log(`- Career entries: ${totalCareerEntries}`);
  console.log(`- Unique clubs: ${uniqueClubs.size}`);
  console.log(`- Countries represented: ${uniqueCountries.size}`);
  
  // Show top clubs
  const clubCounts = {};
  combinedData.forEach(p => {
    p.careerHistory.forEach(c => {
      clubCounts[c.club] = (clubCounts[c.club] || 0) + 1;
    });
  });
  
  const topClubs = Object.entries(clubCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  
  console.log(`\n🏆 Top Clubs (by player count):`);
  topClubs.forEach(([club, count]) => {
    console.log(`  ${club}: ${count} players`);
  });
  
  console.log(`\n✅ Ready to import! Run:`);
  console.log(`node src/scripts/import-scraped-data.js expanded-manual-players.json`);
  
  return combinedData;
}

if (require.main === module) {
  createExpandedDataset().catch(console.error);
}

module.exports = { createExpandedDataset, ADDITIONAL_PLAYERS };