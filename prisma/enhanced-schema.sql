-- Add leagues and federations for filtering
CREATE TABLE federations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL, -- 'UEFA', 'CONMEBOL', 'FIFA', etc.
  code VARCHAR(10) NOT NULL, -- 'UEFA', 'CONMEBOL', 'FIFA'
  region VARCHAR(50), -- 'Europe', 'South America', 'Global'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE leagues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL, -- 'Premier League', 'La Liga', etc.
  country VARCHAR(50),
  federation_id INT REFERENCES federations(id),
  tier INT DEFAULT 1, -- 1 = top division, 2 = second division, etc.
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Update teams table to reference leagues
ALTER TABLE teams ADD COLUMN league_id INT REFERENCES leagues(id);
ALTER TABLE teams ADD COLUMN federation_id INT REFERENCES federations(id);

-- Head-to-head challenge system
CREATE TABLE head_to_head_challenges (
  id SERIAL PRIMARY KEY,
  challenge_code VARCHAR(20) UNIQUE NOT NULL, -- shareable code like "H2H-ABC123"
  
  -- Challenge creator (must be premium)
  created_by INT REFERENCES users(id),
  
  -- Challenge parameters
  start_player_id INT REFERENCES players(id),
  end_player_id INT REFERENCES players(id),
  
  -- Filtering options (premium features)
  federation_filter INT REFERENCES federations(id), -- only use players from this federation
  league_filter INT REFERENCES leagues(id), -- only use players from this league
  difficulty_target VARCHAR(20), -- 'easy', 'medium', 'hard' - affects player selection
  
  -- Challenge metadata
  title VARCHAR(200),
  description TEXT,
  custom_message TEXT, -- personal message from challenger
  
  -- Game settings
  time_limit INT, -- seconds, null = no limit
  hints_allowed BOOLEAN DEFAULT true,
  max_attempts INT DEFAULT 1,
  
  -- Challenge status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'expired'
  expires_at TIMESTAMP, -- challenges can expire
  
  -- Stats
  total_participants INT DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  average_time INT,
  fastest_time INT,
  fastest_time_user_id INT REFERENCES users(id),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Participants in head-to-head challenges
CREATE TABLE challenge_participants (
  id SERIAL PRIMARY KEY,
  challenge_id INT REFERENCES head_to_head_challenges(id),
  user_id INT REFERENCES users(id), -- null for anonymous players
  anonymous_session VARCHAR(100), -- for non-registered players
  
  -- Invitation tracking
  invited_by INT REFERENCES users(id),
  invitation_sent_at TIMESTAMP,
  started_at TIMESTAMP,
  
  -- Results
  completed BOOLEAN DEFAULT false,
  steps_taken INT,
  time_taken INT, -- in seconds
  score_earned INT,
  path_found JSONB,
  
  -- Ranking within this challenge
  rank_position INT,
  is_winner BOOLEAN DEFAULT false,
  
  -- Metadata
  gave_up BOOLEAN DEFAULT false,
  hints_used INT DEFAULT 0,
  attempts_used INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Challenge invitations system
CREATE TABLE challenge_invitations (
  id SERIAL PRIMARY KEY,
  challenge_id INT REFERENCES head_to_head_challenges(id),
  
  -- Invitation details
  invited_by INT REFERENCES users(id),
  invited_user_id INT REFERENCES users(id), -- null if invited by email/link
  invited_email VARCHAR(255), -- for non-registered users
  invitation_message TEXT,
  
  -- Invitation status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
  sent_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  
  -- Tracking
  invitation_link VARCHAR(500), -- shareable link for anonymous play
  link_clicks INT DEFAULT 0,
  
  UNIQUE(challenge_id, invited_user_id), -- prevent duplicate invites
  UNIQUE(challenge_id, invited_email) -- prevent duplicate email invites
);

-- Challenge templates for easy creation
CREATE TABLE challenge_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Template parameters
  federation_id INT REFERENCES federations(id),
  league_id INT REFERENCES leagues(id),
  difficulty VARCHAR(20),
  typical_steps INT, -- expected difficulty
  
  -- Popular/featured templates
  usage_count INT DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pre-generated challenge pairs for different difficulties/leagues
CREATE TABLE challenge_pairs (
  id SERIAL PRIMARY KEY,
  start_player_id INT REFERENCES players(id),
  end_player_id INT REFERENCES players(id),
  
  -- Metadata
  difficulty VARCHAR(20), -- calculated difficulty
  optimal_steps INT, -- minimum steps possible
  federation_id INT REFERENCES federations(id),
  league_id INT REFERENCES leagues(id),
  
  -- Usage tracking
  times_used INT DEFAULT 0,
  average_completion_time INT,
  completion_rate DECIMAL(5,2),
  
  -- Quality control
  verified BOOLEAN DEFAULT false, -- manually verified connections
  quality_score DECIMAL(3,2), -- 1-5 rating based on user feedback
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Federation and league data
INSERT INTO federations (name, code, region) VALUES
('FIFA', 'FIFA', 'Global'),
('UEFA', 'UEFA', 'Europe'),
('CONMEBOL', 'CONMEBOL', 'South America'),
('CONCACAF', 'CONCACAF', 'North America'),
('CAF', 'CAF', 'Africa'),
('AFC', 'AFC', 'Asia'),
('OFC', 'OFC', 'Oceania');

INSERT INTO leagues (name, country, federation_id, tier) VALUES
('Premier League', 'England', (SELECT id FROM federations WHERE code = 'UEFA'), 1),
('La Liga', 'Spain', (SELECT id FROM federations WHERE code = 'UEFA'), 1),
('Serie A', 'Italy', (SELECT id FROM federations WHERE code = 'UEFA'), 1),
('Bundesliga', 'Germany', (SELECT id FROM federations WHERE code = 'UEFA'), 1),
('Ligue 1', 'France', (SELECT id FROM federations WHERE code = 'UEFA'), 1),
('Brazilian Serie A', 'Brazil', (SELECT id FROM federations WHERE code = 'CONMEBOL'), 1),
('Argentine Primera', 'Argentina', (SELECT id FROM federations WHERE code = 'CONMEBOL'), 1),
('MLS', 'United States', (SELECT id FROM federations WHERE code = 'CONCACAF'), 1);

-- Indexes for performance
CREATE INDEX idx_head_to_head_challenges_code ON head_to_head_challenges(challenge_code);
CREATE INDEX idx_head_to_head_challenges_created_by ON head_to_head_challenges(created_by);
CREATE INDEX idx_challenge_participants_challenge_id ON challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user_id ON challenge_participants(user_id);
CREATE INDEX idx_challenge_invitations_challenge_id ON challenge_invitations(challenge_id);
CREATE INDEX idx_challenge_pairs_difficulty ON challenge_pairs(difficulty);
CREATE INDEX idx_challenge_pairs_federation ON challenge_pairs(federation_id);
