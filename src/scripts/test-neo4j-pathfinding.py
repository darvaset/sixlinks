import os
from datetime import datetime
from neo4j import GraphDatabase
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

# Neo4j connection
uri = os.getenv('NEO4J_URI')
username = os.getenv('NEO4J_USERNAME')
password = os.getenv('NEO4J_PASSWORD')

driver = GraphDatabase.driver(uri, auth=(username, password))

def test_pathfinding():
    with driver.session() as session:
        print("🧪 Testing Neo4j pathfinding performance...\n")
        
        # Test 1: Harry Kane to Bukayo Saka (with path details)
        print("1. Harry Kane → Bukayo Saka")
        start = datetime.now()
        
        result = session.run("""
            MATCH path = shortestPath(
                (kane:Player {name: "Harry Kane"})-[*..6]-(saka:Player {name: "Bukayo Saka"})
            )
            RETURN path, length(path) as pathLength,
                   [node in nodes(path) | node.name] as nodeNames,
                   [rel in relationships(path) | type(rel)] as relTypes
        """)
        
        record = result.single()
        duration = (datetime.now() - start).total_seconds() * 1000
        
        if record:
            print(f"  ✅ Found in {duration:.2f}ms - {record['pathLength']} steps")
            print(f"  Path: {' → '.join(record['nodeNames'])}")
            print(f"  Relationships: {' → '.join(record['relTypes'])}")
        
        # Test 2: Direct national team connection
        print("\n2. Testing direct national team connection:")
        start = datetime.now()
        
        result = session.run("""
            MATCH (kane:Player {name: "Harry Kane"})-[:REPRESENTS]->(nt:NationalTeam)<-[:REPRESENTS]-(saka:Player {name: "Bukayo Saka"})
            RETURN nt.name as nationalTeam
        """)
        
        record = result.single()
        duration = (datetime.now() - start).total_seconds() * 1000
        
        if record:
            print(f"  ✅ Both play for {record['nationalTeam']} - query took {duration:.2f}ms")
        else:
            print("  ❌ No shared national team found")
        
        # Test 3: More complex paths
        test_cases = [
            ("Mohamed Salah", "Kevin De Bruyne"),
            ("Lionel Messi", "Cristiano Ronaldo"),
            ("Erling Haaland", "Kylian Mbappé")
        ]
        
        print("\n3. Testing other paths:")
        for player1, player2 in test_cases:
            start = datetime.now()
            
            result = session.run("""
                MATCH path = shortestPath(
                    (p1:Player {name: $player1})-[*..6]-(p2:Player {name: $player2})
                )
                RETURN length(path) as pathLength
            """, player1=player1, player2=player2)
            
            record = result.single()
            duration = (datetime.now() - start).total_seconds() * 1000
            
            if record:
                print(f"  {player1} → {player2}: {record['pathLength']} steps in {duration:.2f}ms")
            else:
                print(f"  {player1} → {player2}: No path found in {duration:.2f}ms")
        
        # Test 4: Database statistics
        print("\n4. Database Statistics:")
        result = session.run("""
            MATCH (p:Player) WITH count(p) as players
            MATCH (t:Team) WITH players, count(t) as teams
            MATCH (nt:NationalTeam) WITH players, teams, count(nt) as nationalTeams
            MATCH ()-[r]->() WITH players, teams, nationalTeams, count(r) as relationships
            RETURN players, teams, nationalTeams, relationships
        """)
        
        stats = result.single()
        print(f"  Players: {stats['players']:,}")
        print(f"  Teams: {stats['teams']:,}")
        print(f"  National Teams: {stats['nationalTeams']:,}")
        print(f"  Total Relationships: {stats['relationships']:,}")

# Run tests
test_pathfinding()
driver.close()
