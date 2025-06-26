import { prisma } from './prisma'

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
  try {
    console.log('🌱 Starting database seeding...')

    // Clear existing data
    await prisma.playerManager.deleteMany()
    await prisma.playerTeam.deleteMany()
    await prisma.managerTeam.deleteMany()
    await prisma.player.deleteMany()
    await prisma.manager.deleteMany()
    await prisma.team.deleteMany()

    // Create teams
    console.log('Creating teams...')
    const teams = await Promise.all(
      sampleData.teams.map(team => 
        prisma.team.create({ data: team })
      )
    )

    // Create players
    console.log('Creating players...')
    const players = await Promise.all(
      sampleData.players.map(player => 
        prisma.player.create({ data: player })
      )
    )

    // Create managers
    console.log('Creating managers...')
    const managers = await Promise.all(
      sampleData.managers.map(manager => 
        prisma.manager.create({ data: manager })
      )
    )

    // Create player-team relationships
    console.log('Creating player-team relationships...')
    
    // Find teams and players by name for relationships
    const barcelona = teams.find(t => t.name === 'FC Barcelona')!
    const realMadrid = teams.find(t => t.name === 'Real Madrid')!
    const psg = teams.find(t => t.name === 'Paris Saint-Germain')!
    const manCity = teams.find(t => t.name === 'Manchester City')!
    const interMiami = teams.find(t => t.name === 'Inter Miami')!
    const alNassr = teams.find(t => t.name === 'Al Nassr')!
    const juventus = teams.find(t => t.name === 'Juventus')!
    const manUnited = teams.find(t => t.name === 'Manchester United')!
    const argentina = teams.find(t => t.name === 'Argentina National Team')!
    const portugal = teams.find(t => t.name === 'Portugal National Team')!
    const brazil = teams.find(t => t.name === 'Brazil National Team')!
    const france = teams.find(t => t.name === 'France National Team')!

    const messi = players.find(p => p.name === 'Lionel Messi')!
    const ronaldo = players.find(p => p.name === 'Cristiano Ronaldo')!
    const neymar = players.find(p => p.name === 'Neymar Jr')!
    const mbappe = players.find(p => p.name === 'Kylian Mbappé')!
    const busquets = players.find(p => p.name === 'Sergio Busquets')!
    const ramos = players.find(p => p.name === 'Sergio Ramos')!
    const modric = players.find(p => p.name === 'Luka Modrić')!
    const debruyne = players.find(p => p.name === 'Kevin De Bruyne')!
    const haaland = players.find(p => p.name === 'Erling Haaland')!
    const pedri = players.find(p => p.name === 'Pedri')!
    const gavi = players.find(p => p.name === 'Gavi')!
    const ronaldinho = players.find(p => p.name === 'Ronaldinho')!

    // Create relationships that will make interesting connections
    const playerTeamRelations = [
      // Messi's career
      { playerId: messi.id, teamId: barcelona.id, startDate: new Date('2004-01-01'), endDate: new Date('2021-08-01') },
      { playerId: messi.id, teamId: psg.id, startDate: new Date('2021-08-01'), endDate: new Date('2023-06-01') },
      { playerId: messi.id, teamId: interMiami.id, startDate: new Date('2023-07-01'), endDate: null },
      { playerId: messi.id, teamId: argentina.id, startDate: new Date('2005-01-01'), endDate: null },

      // Ronaldo's career
      { playerId: ronaldo.id, teamId: manUnited.id, startDate: new Date('2003-01-01'), endDate: new Date('2009-06-01') },
      { playerId: ronaldo.id, teamId: realMadrid.id, startDate: new Date('2009-07-01'), endDate: new Date('2018-06-01') },
      { playerId: ronaldo.id, teamId: juventus.id, startDate: new Date('2018-07-01'), endDate: new Date('2021-06-01') },
      { playerId: ronaldo.id, teamId: manUnited.id, startDate: new Date('2021-08-01'), endDate: new Date('2022-11-01') },
      { playerId: ronaldo.id, teamId: alNassr.id, startDate: new Date('2023-01-01'), endDate: null },
      { playerId: ronaldo.id, teamId: portugal.id, startDate: new Date('2003-01-01'), endDate: null },

      // Busquets - the connection between Messi and others
      { playerId: busquets.id, teamId: barcelona.id, startDate: new Date('2008-01-01'), endDate: new Date('2023-06-01') },
      { playerId: busquets.id, teamId: interMiami.id, startDate: new Date('2023-07-01'), endDate: null },

      // Ramos - connections to both Barca players and Madrid
      { playerId: ramos.id, teamId: realMadrid.id, startDate: new Date('2005-01-01'), endDate: new Date('2021-06-01') },
      { playerId: ramos.id, teamId: psg.id, startDate: new Date('2021-07-01'), endDate: new Date('2023-06-01') },

      // Neymar - Brazil and PSG connection
      { playerId: neymar.id, teamId: barcelona.id, startDate: new Date('2013-01-01'), endDate: new Date('2017-08-01') },
      { playerId: neymar.id, teamId: psg.id, startDate: new Date('2017-08-01'), endDate: null },
      { playerId: neymar.id, teamId: brazil.id, startDate: new Date('2010-01-01'), endDate: null },

      // Other key connections
      { playerId: modric.id, teamId: realMadrid.id, startDate: new Date('2012-01-01'), endDate: null },
      { playerId: debruyne.id, teamId: manCity.id, startDate: new Date('2015-01-01'), endDate: null },
      { playerId: haaland.id, teamId: manCity.id, startDate: new Date('2022-07-01'), endDate: null },
      { playerId: pedri.id, teamId: barcelona.id, startDate: new Date('2020-01-01'), endDate: null },
      { playerId: gavi.id, teamId: barcelona.id, startDate: new Date('2021-01-01'), endDate: null },
      { playerId: ronaldinho.id, teamId: barcelona.id, startDate: new Date('2003-01-01'), endDate: new Date('2008-06-01') },
      { playerId: ronaldinho.id, teamId: brazil.id, startDate: new Date('1999-01-01'), endDate: new Date('2013-01-01') },
    ]

    await Promise.all(
      playerTeamRelations.map(relation => 
        prisma.playerTeam.create({ data: relation })
      )
    )

    // Create manager-team relationships
    console.log('Creating manager-team relationships...')
    const guardiola = managers.find(m => m.name === 'Pep Guardiola')!
    const luisEnrique = managers.find(m => m.name === 'Luis Enrique')!
    const tataMartino = managers.find(m => m.name === 'Tata Martino')!

    const managerTeamRelations = [
      { managerId: guardiola.id, teamId: barcelona.id, startDate: new Date('2008-01-01'), endDate: new Date('2012-06-01') },
      { managerId: guardiola.id, teamId: manCity.id, startDate: new Date('2016-07-01'), endDate: null },
      { managerId: luisEnrique.id, teamId: barcelona.id, startDate: new Date('2014-07-01'), endDate: new Date('2017-06-01') },
      { managerId: tataMartino.id, teamId: barcelona.id, startDate: new Date('2013-07-01'), endDate: new Date('2014-06-01') },
      { managerId: tataMartino.id, teamId: interMiami.id, startDate: new Date('2023-06-01'), endDate: null },
    ]

    await Promise.all(
      managerTeamRelations.map(relation => 
        prisma.managerTeam.create({ data: relation })
      )
    )

    // Create player-manager relationships
    console.log('Creating player-manager relationships...')
    const playerManagerRelations = [
      // Guardiola coached Messi, Busquets, Pedri at Barcelona
      { playerId: messi.id, managerId: guardiola.id, teamId: barcelona.id, startDate: new Date('2008-01-01'), endDate: new Date('2012-06-01') },
      { playerId: busquets.id, managerId: guardiola.id, teamId: barcelona.id, startDate: new Date('2008-01-01'), endDate: new Date('2012-06-01') },
      
      // Luis Enrique coached Messi, Busquets, Neymar
      { playerId: messi.id, managerId: luisEnrique.id, teamId: barcelona.id, startDate: new Date('2014-07-01'), endDate: new Date('2017-06-01') },
      { playerId: busquets.id, managerId: luisEnrique.id, teamId: barcelona.id, startDate: new Date('2014-07-01'), endDate: new Date('2017-06-01') },
      { playerId: neymar.id, managerId: luisEnrique.id, teamId: barcelona.id, startDate: new Date('2014-07-01'), endDate: new Date('2017-06-01') },

      // Tata Martino coached Messi at Barcelona and Inter Miami
      { playerId: messi.id, managerId: tataMartino.id, teamId: barcelona.id, startDate: new Date('2013-07-01'), endDate: new Date('2014-06-01') },
      { playerId: messi.id, managerId: tataMartino.id, teamId: interMiami.id, startDate: new Date('2023-07-01'), endDate: null },
      { playerId: busquets.id, managerId: tataMartino.id, teamId: interMiami.id, startDate: new Date('2023-07-01'), endDate: null },
    ]

    await Promise.all(
      playerManagerRelations.map(relation => 
        prisma.playerManager.create({ data: relation })
      )
    )

    console.log('✅ Database seeding completed successfully!')
    console.log(`Created:`)
    console.log(`- ${teams.length} teams`)
    console.log(`- ${players.length} players`) 
    console.log(`- ${managers.length} managers`)
    console.log(`- ${playerTeamRelations.length} player-team relationships`)
    console.log(`- ${managerTeamRelations.length} manager-team relationships`)
    console.log(`- ${playerManagerRelations.length} player-manager relationships`)

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}
