# **Six Degrees of World Football**

### **_Discover how any two football players are connected through their careers, teammates, and managers._**

A web-based game that finds connections between football players using the "six degrees of separation" concept. The project is fully functional, using a high-performance graph database to deliver connection results in real-time.

## **Key Features**

- **High-Performance Pathfinding:** Utilizes a Neo4j Graph Database to find connections between players in under a second for most queries.
- **Intelligent Step Counting:** Correctly identifies a "teammate" connection (Player → Team → Player) as a single logical step.
- **Dynamic Date Information:** Calculates and displays the specific time periods when players were connected, such as "2020-2022" or "since 2024".
- **Engaging UI:** Features a swipeable carousel interface to display connection paths, with animations powered by Framer Motion.
- **Live Database Stats:** The UI dynamically displays metrics like total players, connections, and leagues covered, fetched directly from the database.

## **Technology Stack & Architecture**

The project uses a modern, dual-database architecture for optimal performance and scalability.

### **Frontend**

- **Framework:** Next.js 14 (with App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **State Management:** Custom Hooks (usePathfinding) for clean, reusable logic

### **Backend**

- **Primary Database (Pathfinding):** Neo4j Graph Database
- **Secondary** Database (User Data): PostgreSQL / Supabase
- **API:** Next.js API Routes (Serverless)

### **Architecture Flow**

graph TD

subgraph Frontend

A\[page.tsx\] -->|uses| B\[usePathfinding hook\];

A -->|displays| E\[ConnectionResult.tsx\];

E -->|shows| F\[CarouselStep.tsx\];

A -->|uses for search| G\[PlayerSearch.tsx\];

A -->|displays| I\[StatsBar.tsx\];

end

subgraph Backend

C\[/api/find-path\] -->|queries| D\[Neo4j Database\];

H\[/api/players/search\] -->|queries| D;

J\[/api/stats\] -->|queries| D;

end

B -->|calls API| C;

G -->|calls API| H;

I -->|fetches from| J;

## **Getting Started**

To get a local copy up and running, follow these simple steps.

### **Prerequisites**

- Node.js installed
- A running Neo4j Database instance
- An .env.local file with your environment variables

### **Installation**

Clone the repo:  
git clone <git@github.com>:darvaset/sixlinks.git

Install NPM packages:  
npm install

Create an .env.local file in the root and add your database credentials:  
\# Neo4j Database

NEO4J_URI=bolt://localhost:7687

NEO4J_USER=neo4j

NEO4J_PASSWORD=your-password

\# Supabase (for future features)

NEXT_PUBLIC_SUPABASE_URL=...

NEXT_PUBLIC_SUPABASE_ANΟΝ_ΚΕΥ=...

Run the development server:  
npm run dev

## **API Endpoints**

The project exposes several serverless API endpoints for game logic and data management.

| **Endpoint** | **Method** | **Purpose** |
| --- | --- | --- |
| /api/find-path | POST, GET | Finds the connection between two players. |
| --- | --- | --- |
| /api/players/search | GET | Powers the autocomplete player search. |
| --- | --- | --- |
| /api/stats | GET | Fetches database statistics (player counts, etc.). |
| --- | --- | --- |
| /api/populate-dates | POST | Populates date information into the graph. |
| --- | --- | --- |

## **Next Steps**

The core functionality is complete. Future development will focus on user-centric features.

1. **Authentication System:** Adding user accounts, profiles, and saved connections.
2. **Social Features:** Implementing social sharing and daily challenges with leaderboards.
3. **Caching Layer:** Introducing a caching strategy (e.g., Redis) to improve performance for frequent queries.
4. **Data Expansion:** Adding more players, leagues, and historical data to enrich the game content.