import { PrismaClient } from '@prisma/client';
import { syncAllToNeo4j } from '../src/lib/neo4j-sync.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create Persons
  const messi = await prisma.person.upsert({
    where: { name: 'Lionel Messi' }, // 'name' is now unique
    update: {},
    create: {
      name: 'Lionel Messi',
      fullName: 'Lionel Andrés Messi Cuccittini',
      nationality: 'Argentina',
      primaryPosition: 'Forward',
      birthDate: new Date('1987-06-24T00:00:00Z'),
      isRetired: false,
    },
  });

  const ronaldo = await prisma.person.upsert({
    where: { name: 'Cristiano Ronaldo' }, // 'name' is now unique
    update: {},
    create: {
      name: 'Cristiano Ronaldo',
      fullName: 'Cristiano Ronaldo dos Santos Aveiro',
      nationality: 'Portugal',
      primaryPosition: 'Forward',
      birthDate: new Date('1985-02-05T00:00:00Z'),
      isRetired: false,
    },
  });

  const guardiola = await prisma.person.upsert({
    where: { name: 'Pep Guardiola' }, // 'name' is now unique
    update: {},
    create: {
      name: 'Pep Guardiola',
      fullName: 'Josep Guardiola Sala',
      nationality: 'Spain',
      primaryPosition: 'Midfielder', // Played as midfielder
      birthDate: new Date('1971-01-18T00:00:00Z'),
      isRetired: false, // Not retired from management
    },
  });

  const mourinho = await prisma.person.upsert({
    where: { name: 'Jose Mourinho' }, // 'name' is now unique
    update: {},
    create: {
      name: 'Jose Mourinho',
      fullName: 'José Mário dos Santos Félix Mourinho',
      nationality: 'Portugal',
      primaryPosition: null, // Manager-only (in this dataset)
      birthDate: new Date('1963-01-26T00:00:00Z'),
      isRetired: false,
    },
  });

  const busquets = await prisma.person.upsert({
    where: { name: 'Sergio Busquets' }, // 'name' is now unique
    update: {},
    create: {
      name: 'Sergio Busquets',
      fullName: 'Sergio Busquets Burgos',
      nationality: 'Spain',
      primaryPosition: 'Midfielder',
      birthDate: new Date('1988-07-16T00:00:00Z'),
      isRetired: false,
    },
  });

  const benzema = await prisma.person.upsert({
    where: { name: 'Karim Benzema' }, // 'name' is now unique
    update: {},
    create: {
      name: 'Karim Benzema',
      fullName: 'Karim Mostafa Benzema',
      nationality: 'France',
      primaryPosition: 'Forward',
      birthDate: new Date('1987-12-19T00:00:00Z'),
      isRetired: false,
    },
  });

  console.log('Created persons:', { messi, ronaldo, guardiola, mourinho, busquets, benzema });

  // 2. Create Clubs
  const barcelona = await prisma.club.upsert({
    where: { name_country: { name: 'Barcelona', country: 'Spain' } }, // Compound unique
    update: {},
    create: {
      name: 'Barcelona',
      shortName: 'Barça',
      country: 'Spain',
      city: 'Barcelona',
      currentLeague: 'La Liga',
    },
  });

  const realMadrid = await prisma.club.upsert({
    where: { name_country: { name: 'Real Madrid', country: 'Spain' } }, // Compound unique
    update: {},
    create: {
      name: 'Real Madrid',
      shortName: 'Real',
      country: 'Spain',
      city: 'Madrid',
      currentLeague: 'La Liga',
    },
  });

  const manCity = await prisma.club.upsert({
    where: { name_country: { name: 'Manchester City', country: 'England' } }, // Compound unique
    update: {},
    create: {
      name: 'Manchester City',
      shortName: 'Man City',
      country: 'England',
      city: 'Manchester',
      currentLeague: 'Premier League',
    },
  });

  const chelsea = await prisma.club.upsert({
    where: { name_country: { name: 'Chelsea', country: 'England' } }, // Compound unique
    update: {},
    create: {
      name: 'Chelsea',
      country: 'England',
      city: 'London',
      currentLeague: 'Premier League',
    },
  });

  console.log('Created clubs:', { barcelona, realMadrid, manCity, chelsea });

  // 3. Create National Teams
  const argentina = await prisma.nationalTeam.upsert({
    where: { name: 'Argentina' }, // 'name' is unique
    update: {},
    create: {
      name: 'Argentina',
      fifaCode: 'ARG',
      confederation: 'CONMEBOL',
    },
  });

  const portugal = await prisma.nationalTeam.upsert({
    where: { name: 'Portugal' }, // 'name' is unique
    update: {},
    create: {
      name: 'Portugal',
      fifaCode: 'POR',
      confederation: 'UEFA',
    },
  });

  const spain = await prisma.nationalTeam.upsert({
    where: { name: 'Spain' }, // 'name' is unique
    update: {},
    create: {
      name: 'Spain',
      fifaCode: 'ESP',
      confederation: 'UEFA',
    },
  });

  const france = await prisma.nationalTeam.upsert({
    where: { name: 'France' }, // 'name' is unique
    update: {},
    create: {
      name: 'France',
      fifaCode: 'FRA',
      confederation: 'UEFA',
    },
  });

  console.log('Created national teams:', { argentina, portugal, spain, france });

  // 4. Create Stints (designed for connections)

  // Messi: Barcelona player, Argentina player
  await prisma.clubPlayerStint.upsert({
    where: {
      personId_clubId_startDate: {
        personId: messi.id,
        clubId: barcelona.id,
        startDate: new Date('2004-10-16T00:00:00Z'),
      },
    },
    update: {},
    create: {
      personId: messi.id,
      clubId: barcelona.id,
      startDate: new Date('2004-10-16T00:00:00Z'),
      endDate: new Date('2021-08-05T00:00:00Z'),
      position: 'Forward',
    },
  });
  await prisma.nationalTeamPlayerStint.upsert({
    where: { personId_nationalTeamId: { personId: messi.id, nationalTeamId: argentina.id } }, // Compound unique
    update: {},
    create: {
      personId: messi.id,
      nationalTeamId: argentina.id,
      firstCap: new Date('2005-08-17T00:00:00Z'),
      lastCap: new Date('2024-01-01T00:00:00Z'), // Still active
      totalCaps: 180,
    },
  });

  // Busquets: Barcelona player (overlaps with Messi), Spain player (overlaps with Guardiola as manager)
  await prisma.clubPlayerStint.upsert({
    where: {
      personId_clubId_startDate: {
        personId: busquets.id,
        clubId: barcelona.id,
        startDate: new Date('2008-09-13T00:00:00Z'),
      },
    },
    update: {},
    create: {
      personId: busquets.id,
      clubId: barcelona.id,
      startDate: new Date('2008-09-13T00:00:00Z'),
      endDate: new Date('2023-06-30T00:00:00Z'),
      position: 'Midfielder',
    },
  });
  await prisma.nationalTeamPlayerStint.upsert({
    where: { personId_nationalTeamId: { personId: busquets.id, nationalTeamId: spain.id } }, // Compound unique
    update: {},
    create: {
      personId: busquets.id,
      nationalTeamId: spain.id,
      firstCap: new Date('2009-02-11T00:00:00Z'),
      lastCap: new Date('2022-12-06T00:00:00Z'),
      totalCaps: 143,
    },
  });


  // Ronaldo: Real Madrid player, Portugal player
  await prisma.clubPlayerStint.upsert({
    where: {
      personId_clubId_startDate: {
        personId: ronaldo.id,
        clubId: realMadrid.id,
        startDate: new Date('2009-07-01T00:00:00Z'),
      },
    },
    update: {},
    create: {
      personId: ronaldo.id,
      clubId: realMadrid.id,
      startDate: new Date('2009-07-01T00:00:00Z'),
      endDate: new Date('2018-07-10T00:00:00Z'),
      position: 'Forward',
    },
  });
  await prisma.nationalTeamPlayerStint.upsert({
    where: { personId_nationalTeamId: { personId: ronaldo.id, nationalTeamId: portugal.id } }, // Compound unique
    update: {},
    create: {
      personId: ronaldo.id,
      nationalTeamId: portugal.id,
      firstCap: new Date('2003-08-20T00:00:00Z'),
      lastCap: new Date('2024-01-01T00:00:00Z'), // Still active
      totalCaps: 200,
    },
  });

  // Benzema: Real Madrid player (overlaps with Ronaldo)
  await prisma.clubPlayerStint.upsert({
    where: {
      personId_clubId_startDate: {
        personId: benzema.id,
        clubId: realMadrid.id,
        startDate: new Date('2009-07-09T00:00:00Z'),
      },
    },
    update: {},
    create: {
      personId: benzema.id,
      clubId: realMadrid.id,
      startDate: new Date('2009-07-09T00:00:00Z'),
      endDate: new Date('2023-06-21T00:00:00Z'),
      position: 'Forward',
    },
  });
    await prisma.nationalTeamPlayerStint.upsert({
    where: { personId_nationalTeamId: { personId: benzema.id, nationalTeamId: france.id } }, // Compound unique
    update: {},
    create: {
      personId: benzema.id,
      nationalTeamId: france.id,
      firstCap: new Date('2007-03-28T00:00:00Z'),
      lastCap: new Date('2022-12-19T00:00:00Z'),
      totalCaps: 97,
    },
  });


  // Guardiola: Barcelona player, Barcelona manager (overlaps with Messi/Busquets), Man City manager
  await prisma.clubPlayerStint.upsert({
    where: {
      personId_clubId_startDate: {
        personId: guardiola.id,
        clubId: barcelona.id,
        startDate: new Date('1990-08-16T00:00:00Z'),
      },
    },
    update: {},
    create: {
      personId: guardiola.id,
      clubId: barcelona.id,
      startDate: new Date('1990-08-16T00:00:00Z'),
      endDate: new Date('2001-06-30T00:00:00Z'),
      position: 'Midfielder',
    },
  });
  await prisma.clubManagerStint.upsert({
    where: {
      personId_clubId_startDate: {
        personId: guardiola.id,
        clubId: barcelona.id,
        startDate: new Date('2008-07-01T00:00:00Z'),
      },
    },
    update: {},
    create: {
      personId: guardiola.id,
      clubId: barcelona.id,
      startDate: new Date('2008-07-01T00:00:00Z'),
      endDate: new Date('2012-06-30T00:00:00Z'), // Overlaps with Messi/Busquets player stints
      role: 'manager',
    },
  });
  await prisma.clubManagerStint.upsert({
    where: {
      personId_clubId_startDate: {
        personId: guardiola.id,
        clubId: manCity.id,
        startDate: new Date('2016-07-01T00:00:00Z'),
      },
    },
    update: {},
    create: {
      personId: guardiola.id,
      clubId: manCity.id,
      startDate: new Date('2016-07-01T00:00:00Z'),
      endDate: new Date('2025-06-30T00:00:00Z'), // Current
      role: 'manager',
    },
  });

  // Mourinho: Real Madrid manager (overlaps with Ronaldo/Benzema), Chelsea manager
  await prisma.clubManagerStint.upsert({
    where: {
      personId_clubId_startDate: {
        personId: mourinho.id,
        clubId: realMadrid.id,
        startDate: new Date('2010-05-31T00:00:00Z'),
      },
    },
    update: {},
    create: {
      personId: mourinho.id,
      clubId: realMadrid.id,
      startDate: new Date('2010-05-31T00:00:00Z'),
      endDate: new Date('2013-06-01T00:00:00Z'), // Overlaps with Ronaldo/Benzema player stints
      role: 'manager',
    },
  });
  await prisma.clubManagerStint.upsert({
    where: {
      personId_clubId_startDate: {
        personId: mourinho.id,
        clubId: chelsea.id,
        startDate: new Date('2013-06-03T00:00:00Z'),
      },
    },
    update: {},
    create: {
      personId: mourinho.id,
      clubId: chelsea.id,
      startDate: new Date('2013-06-03T00:00:00Z'),
      endDate: new Date('2015-12-17T00:00:00Z'),
      role: 'manager',
    },
  });
    // Guardiola as Spain National Team manager (for Busquets)
  await prisma.nationalTeamManagerStint.upsert({
    where: {
      personId_nationalTeamId_startDate: {
        personId: guardiola.id,
        nationalTeamId: spain.id,
        startDate: new Date('2008-07-01T00:00:00Z'),
      },
    },
    update: {},
    create: {
      personId: guardiola.id,
      nationalTeamId: spain.id,
      startDate: new Date('2008-07-01T00:00:00Z'),
      endDate: new Date('2012-06-30T00:00:00Z'), // Overlaps with Busquets player stint
      role: 'manager',
    },
  });


  console.log('Created stints.');

  // 5. Sync to Neo4j
  console.log('Starting Neo4j sync...');
  try {
    const syncResult = await syncAllToNeo4j();
    console.log('Neo4j sync completed successfully:', syncResult);
  } catch (error) {
    console.error('Neo4j sync failed:', error);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });