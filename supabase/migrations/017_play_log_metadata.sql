-- Store small game-specific payloads such as pixel-art boards with play logs.
ALTER TABLE public.play_logs
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';
