// import { prisma } from './prisma'

export const sampleData = {
  teams: [
    { name: 'FC Barcelona', country: 'Spain', league: 'La Liga' },
    { name: 'Real Madrid', country: 'Spain', league: 'La Liga' },
    { name: 'Paris Saint-Germain', country: 'France', league: 'Ligue 1' },
    { name: 'Manchester City', country: 'England', league: 'Premier League' },
    { name: 'Inter Miami', country: 'USA', league: 'MLS' },
    { name: 'Al Nassr', country: 'Saudi Arabia', league: 'Saudi Pro League' },
    { name: 'Juventus', country: 'Italy', league: 'Serie A' },
    { name: 'Manchester United', country: 'England', league: 'Premier League' },
    { name: 'Bayern Munich', country: 'Germany', league: 'Bundesliga' },
    { name: 'Brazil National Team', country: 'Brazil', league: 'International' },
    { name: 'Argentina National Team', country: 'Argentina', league: 'International' },
    { name: 'Portugal National Team', country: 'Portugal', league: 'International' },
  ],

  players: [
    { name: 'Lionel Messi', fullName: 'Lionel Andrés Messi', nationality: 'Argentina', position: 'Forward' },
    { name: 'Cristiano Ronaldo', fullName: 'Cristiano Ronaldo dos Santos Aveiro', nationality: 'Portugal', position: 'Forward' },
    { name: 'Neymar Jr', fullName: 'Neymar da Silva Santos Júnior', nationality: 'Brazil', position: 'Forward' },
    { name: 'Kylian Mbappé', fullName: 'Kylian Mbappé Lottin', nationality: 'France', position: 'Forward' },
    { name: 'Sergio Busquets', fullName: 'Sergio Busquets Burgos', nationality: 'Spain', position: 'Midfielder' },
    { name: 'Sergio Ramos', fullName: 'Sergio Ramos García', nationality: 'Spain', position: 'Defender' },
    { name: 'Luka Modrić', fullName: 'Luka Modrić', nationality: 'Croatia', position: 'Midfielder' },
    { name: 'Kevin De Bruyne', fullName: 'Kevin De Bruyne', nationality: 'Belgium', position: 'Midfielder' },
    { name: 'Erling Haaland', fullName: 'Erling Braut Haaland', nationality: 'Norway', position: 'Forward' },
    { name: 'Pedri', fullName: 'Pedro González López', nationality: 'Spain', position: 'Midfielder' },
    { name: 'Gavi', fullName: 'Pablo Martín Páez Gavira', nationality: 'Spain', position: 'Midfielder' },
    { name: 'Ronaldinho', fullName: 'Ronaldo de Assis Moreira', nationality: 'Brazil', position: 'Forward' },
  ],

  managers: [
    { name: 'Pep Guardiola', nationality: 'Spain' },
    { name: 'Luis Enrique', nationality: 'Spain' },
    { name: 'Tata Martino', nationality: 'Argentina' },
    { name: 'Ronald Koeman', nationality: 'Netherlands' },
    { name: 'Frank Rijkaard', nationality: 'Netherlands' },
  ]
}

export async function seedDatabase() {
  // try {
  //   console.log('🌱 Starting database seeding...')
  //   // The following code is commented out because it depends on the old schema.
  //   // It needs to be updated to use the new schema with ClubStint, ManagerClubStint, and NationalTeamCap.
  //   // Clear existing data
  //   // await prisma.playerManager.deleteMany()
  //   // await prisma.playerTeam.deleteMany()
  //   // await prisma.managerTeam.deleteMany()
  //   // await prisma.player.deleteMany()
  //   // await prisma.manager.deleteMany()
  //   // await prisma.team.deleteMany()
  //   //
  //   // ... rest of the function commented out as it depends on the old schema
  //   //
  // } catch (error) {
  //   console.error('❌ Error seeding database:', error)
  //   throw error
  // }
}
