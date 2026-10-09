-- New Play mini-games use their own game_type values for activity summaries.
ALTER TYPE game_type ADD VALUE IF NOT EXISTS 'adventure';
ALTER TYPE game_type ADD VALUE IF NOT EXISTS 'science';
ALTER TYPE game_type ADD VALUE IF NOT EXISTS 'monster_math';
ALTER TYPE game_type ADD VALUE IF NOT EXISTS 'shape_puzzle';
ALTER TYPE game_type ADD VALUE IF NOT EXISTS 'word_explorer';
ALTER TYPE game_type ADD VALUE IF NOT EXISTS 'pixel_studio';
