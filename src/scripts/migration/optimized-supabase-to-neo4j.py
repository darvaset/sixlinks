# src/scripts/migration/optimized-supabase-to-neo4j.py
import os
import sys
from datetime import datetime
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import logging

# Load environment variables from .env.local
load_dotenv('.env.local')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    from supabase import create_client, Client
    from neo4j import GraphDatabase, Driver
except ImportError:
    logger.error("Missing dependencies. Please install: pip install supabase neo4j python-dotenv")
    sys.exit(1)

class OptimizedFootballETL:
    def __init__(self):
        # Supabase connection - try different env var names
        self.supabase_url = (
            os.getenv('SUPABASE_URL') or 
            os.getenv('NEXT_PUBLIC_SUPABASE_URL') or
            'https://ljpvplosgcrrkwurwufg.supabase.co'  # Your URL from prisma schema
        )
        self.supabase_key = (
            os.getenv('SUPABASE_ANON_KEY') or 
            os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
        )
        
        # If no key, try to extract from database URL
        if not self.supabase_key and os.getenv('DATABASE_URL'):
            # Parse password from DATABASE_URL as a temporary measure
            db_url = os.getenv('DATABASE_URL', '')
            if 'postgres:' in db_url:
                # Extract password between postgres: and @
                try:
                    password = db_url.split('postgres:')[1].split('@')[0]
                    logger.warning("Using database password as Supabase key - this is not recommended for production")
                    self.supabase_key = password
                except:
                    pass
        
        # Neo4j connection
        self.neo4j_uri = os.getenv('NEO4J_URI', 'neo4j+s://your-instance.databases.neo4j.io')
        self.neo4j_username = os.getenv('NEO4J_USERNAME', 'neo4j')
        self.neo4j_password = os.getenv('NEO4J_PASSWORD')
        
        # Validate environment variables
        if not all([self.supabase_url, self.supabase_key]):
            logger.error("Missing Supabase credentials. Please add to .env.local:")
            logger.error("NEXT_PUBLIC_SUPABASE_URL=your-url")
            logger.error("NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key")
            sys.exit(1)
        
        if not self.neo4j_password:
            logger.error("Missing Neo4j password. Please add to .env.local:")
            logger.error("NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io")
            logger.error("NEO4J_USERNAME=neo4j")
            logger.error("NEO4J_PASSWORD=your-password")
            sys.exit(1)
        
        # Initialize clients
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        self.neo4j_driver: Optional[Driver] = None
        
    def connect_neo4j(self):
        """Connect to Neo4j database"""
        try:
            self.neo4j_driver = GraphDatabase.driver(
                self.neo4j_uri,
                auth=(self.neo4j_username, self.neo4j_password)
            )
            # Test connection
            with self.neo4j_driver.session() as session:
                session.run("RETURN 1")
            logger.info("✅ Successfully connected to Neo4j")
        except Exception as e:
            logger.error(f"❌ Failed to connect to Neo4j: {e}")
            logger.error("Make sure your Neo4j instance is running and credentials are correct")
            raise
    
    def clean_neo4j(self):
        """Clean all existing data from Neo4j"""
        logger.info("🧹 Cleaning Neo4j database...")
        with self.neo4j_driver.session() as session:
            session.run("MATCH (n) DETACH DELETE n")
        logger.info("✅ Neo4j database cleaned")
    
    def fetch_with_pagination(self, table: str, batch_size: int = 1000) -> List[Dict[str, Any]]:
        """Fetch all records from a Supabase table with pagination"""
        all_records = []
        offset = 0
        
        while True:
            try:
                response = self.supabase.table(table).select("*").range(offset, offset + batch_size - 1).execute()
                records = response.data
                
                if not records:
                    break
                    
                all_records.extend(records)
                logger.info(f"  Fetched {len(records)} records from {table} (total: {len(all_records)})")
                
                if len(records) < batch_size:
                    break
                    
                offset += batch_size
            except Exception as e:
                logger.error(f"Error fetching from {table}: {e}")
                break
        
        return all_records
    
    def extract_data(self) -> Dict[str, List[Dict[str, Any]]]:
        """Extract all data from Supabase"""
        logger.info("📥 Starting data extraction from Supabase...")
        
        data = {
            'players': self.fetch_with_pagination('players'),
            'teams': self.fetch_with_pagination('teams'),
            'managers': self.fetch_with_pagination('managers'),
            'player_teams': self.fetch_with_pagination('player_teams'),
            'player_managers': self.fetch_with_pagination('player_managers'),
            'manager_teams': self.fetch_with_pagination('manager_teams')
        }
        
        logger.info(f"\n✅ Extraction complete:")
        logger.info(f"   Players: {len(data['players'])}")
        logger.info(f"   Teams: {len(data['teams'])}")
        logger.info(f"   Managers: {len(data['managers'])}")
        
        return data
    
    def create_indexes(self):
        """Create indexes for better performance"""
        logger.info("📇 Creating indexes...")
        
        with self.neo4j_driver.session() as session:
            indexes = [
                "CREATE INDEX player_id IF NOT EXISTS FOR (p:Player) ON (p.id)",
                "CREATE CONSTRAINT player_name_unique IF NOT EXISTS FOR (p:Player) REQUIRE p.name IS UNIQUE",
                "CREATE INDEX player_nationality IF NOT EXISTS FOR (p:Player) ON (p.nationality)",
                "CREATE INDEX team_id IF NOT EXISTS FOR (t:Team) ON (t.id)",
                "CREATE INDEX team_name IF NOT EXISTS FOR (t:Team) ON (t.name)",
                "CREATE INDEX manager_id IF NOT EXISTS FOR (m:Manager) ON (m.id)",
                "CREATE INDEX national_team_country IF NOT EXISTS FOR (nt:NationalTeam) ON (nt.country)",
                "CREATE INDEX season_year IF NOT EXISTS FOR (s:Season) ON (s.year)"
            ]
            
            for index in indexes:
                try:
                    session.run(index)
                except:
                    pass  # Index might already exist
        
        logger.info("✅ Indexes created")
    
    def create_players(self, players: List[Dict[str, Any]], batch_size: int = 500):
        """Create Player nodes in Neo4j"""
        logger.info(f"👤 Creating {len(players)} player nodes...")
        
        with self.neo4j_driver.session() as session:
            for i in range(0, len(players), batch_size):
                batch = players[i:i + batch_size]
                
                query = """
                UNWIND $players AS player
                CREATE (p:Player {
                    id: player.id,
                    name: player.name,
                    fullName: coalesce(player.full_name, player.name),
                    nationality: player.nationality,
                    position: player.position,
                    birthDate: player.birth_date
                })
                """
                
                session.run(query, players=batch)
                logger.info(f"  Created {min(i + batch_size, len(players))} / {len(players)} players")
    
    def create_teams(self, teams: List[Dict[str, Any]]):
        """Create Team nodes in Neo4j"""
        logger.info(f"🏟️  Creating {len(teams)} team nodes...")
        
        with self.neo4j_driver.session() as session:
            query = """
            UNWIND $teams AS team
            CREATE (t:Team {
                id: team.id,
                name: team.name,
                country: team.country,
                league: team.league,
                foundedYear: team.founded_year
            })
            """
            
            session.run(query, teams=teams)
    
    def create_managers(self, managers: List[Dict[str, Any]]):
        """Create Manager nodes in Neo4j"""
        logger.info(f"👔 Creating {len(managers)} manager nodes...")
        
        with self.neo4j_driver.session() as session:
            query = """
            UNWIND $managers AS manager
            CREATE (m:Manager {
                id: manager.id,
                name: manager.name,
                nationality: manager.nationality,
                birthDate: manager.birth_date
            })
            """
            
            session.run(query, managers=managers)
    
    def create_national_teams(self, players: List[Dict[str, Any]]):
        """Create NationalTeam nodes based on player nationalities"""
        logger.info("🏴 Creating national team nodes...")
        
        # Get unique nationalities
        nationalities = set()
        for player in players:
            if player.get('nationality'):
                nationalities.add(player['nationality'])
        
        with self.neo4j_driver.session() as session:
            query = """
            UNWIND $nationalities AS nationality
            CREATE (nt:NationalTeam {
                country: nationality,
                name: nationality + ' National Team'
            })
            """
            
            session.run(query, nationalities=list(nationalities))
            logger.info(f"  Created {len(nationalities)} national team nodes")
    
    def create_relationships(self, data: Dict[str, List[Dict[str, Any]]], batch_size: int = 1000):
        """Create all relationships"""
        logger.info("🔗 Creating relationships...")
        
        with self.neo4j_driver.session() as session:
            # 1. Player -> Team relationships
            logger.info("  Creating player-team relationships...")
            player_teams = data['player_teams']
            
            for i in range(0, len(player_teams), batch_size):
                batch = player_teams[i:i + batch_size]
                
                query = """
                UNWIND $relationships AS rel
                MATCH (p:Player {id: rel.player_id})
                MATCH (t:Team {id: rel.team_id})
                CREATE (p)-[:PLAYED_FOR {
                    startDate: rel.start_date,
                    endDate: rel.end_date,
                    loan: coalesce(rel.loan, false),
                    current: rel.end_date IS NULL
                }]->(t)
                """
                
                session.run(query, relationships=batch)
                
            logger.info(f"    Created {len(player_teams)} player-team relationships")
            
            # 2. Player -> NationalTeam relationships
            logger.info("  Creating player-national team relationships...")
            
            # Get all players with nationality
            players_with_nationality = [p for p in data['players'] if p.get('nationality')]
            
            for i in range(0, len(players_with_nationality), batch_size):
                batch = players_with_nationality[i:i + batch_size]
                
                query = """
                UNWIND $players AS player
                MATCH (p:Player {id: player.id})
                MATCH (nt:NationalTeam {country: player.nationality})
                CREATE (p)-[:REPRESENTS]->(nt)
                """
                
                session.run(query, players=batch)
            
            logger.info(f"    Created {len(players_with_nationality)} national team relationships")
            
            # 3. Player -> Manager relationships
            if data['player_managers']:
                logger.info("  Creating player-manager relationships...")
                
                query = """
                UNWIND $relationships AS rel
                MATCH (p:Player {id: rel.player_id})
                MATCH (m:Manager {id: rel.manager_id})
                CREATE (p)-[:MANAGED_BY {
                    startDate: rel.start_date,
                    endDate: rel.end_date
                }]->(m)
                """
                
                session.run(query, relationships=data['player_managers'])
                logger.info(f"    Created {len(data['player_managers'])} player-manager relationships")
            
            # 4. Manager -> Team relationships
            if data.get('manager_teams'):
                logger.info("  Creating manager-team relationships...")
                
                query = """
                UNWIND $relationships AS rel
                MATCH (m:Manager {id: rel.manager_id})
                MATCH (t:Team {id: rel.team_id})
                CREATE (m)-[:MANAGED {
                    startDate: rel.start_date,
                    endDate: rel.end_date,
                    current: rel.end_date IS NULL
                }]->(t)
                """
                
                session.run(query, relationships=data['manager_teams'])
                logger.info(f"    Created {len(data['manager_teams'])} manager-team relationships")
    
    def run_etl(self):
        """Main ETL process"""
        try:
            start_time = datetime.now()
            
            # Connect to Neo4j
            self.connect_neo4j()
            
            # Clean existing data
            self.clean_neo4j()
            
            # Extract data from Supabase
            data = self.extract_data()
            
            # Create indexes first for better performance
            self.create_indexes()
            
            # Create nodes
            self.create_players(data['players'])
            self.create_teams(data['teams'])
            self.create_managers(data['managers'])
            self.create_national_teams(data['players'])
            
            # Create relationships
            self.create_relationships(data)
            
            # Print final statistics
            logger.info("\n📊 ETL Summary:")
            with self.neo4j_driver.session() as session:
                result = session.run("""
                    MATCH (p:Player) WITH count(p) as players
                    MATCH (t:Team) WITH players, count(t) as teams
                    MATCH (m:Manager) WITH players, teams, count(m) as managers
                    MATCH (nt:NationalTeam) WITH players, teams, managers, count(nt) as nationalTeams
                    MATCH ()-[r]->() WITH players, teams, managers, nationalTeams, count(r) as relationships
                    RETURN players, teams, managers, nationalTeams, relationships
                """)
                
                stats = result.single()
                logger.info(f"   Players: {stats['players']}")
                logger.info(f"   Teams: {stats['teams']}")
                logger.info(f"   Managers: {stats['managers']}")
                logger.info(f"   National Teams: {stats['nationalTeams']}")
                logger.info(f"   Total Relationships: {stats['relationships']}")
            
            duration = datetime.now() - start_time
            logger.info(f"\n✅ ETL completed in {duration.total_seconds():.2f} seconds!")
            
            # Test query
            logger.info("\n🧪 Testing pathfinding...")
            with self.neo4j_driver.session() as session:
                result = session.run("""
                    MATCH path = shortestPath(
                        (kane:Player {name: "Harry Kane"})-[*..6]-(saka:Player {name: "Bukayo Saka"})
                    )
                    RETURN length(path) as pathLength
                """)
                
                record = result.single()
                if record:
                    logger.info(f"✅ Found path from Harry Kane to Bukayo Saka: {record['pathLength']} steps")
                else:
                    logger.info("❌ Could not find path between Harry Kane and Bukayo Saka")
        
        except Exception as e:
            logger.error(f"❌ ETL process failed: {e}")
            raise
        
        finally:
            if self.neo4j_driver:
                self.neo4j_driver.close()

def main():
    """Main execution"""
    logger.info("🚀 Starting Optimized Football Data ETL\n")
    etl = OptimizedFootballETL()
    etl.run_etl()

if __name__ == "__main__":
    main()