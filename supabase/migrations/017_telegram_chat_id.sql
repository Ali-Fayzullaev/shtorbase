-- Add personal Telegram chat ID to each user profile
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
