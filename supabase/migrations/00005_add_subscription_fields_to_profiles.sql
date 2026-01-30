-- Add subscription fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ;

-- Create index for subscription queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_plan, subscription_end) WHERE is_client_paid = true;