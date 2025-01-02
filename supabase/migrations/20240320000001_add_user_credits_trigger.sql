-- Function to initialize user credits
CREATE OR REPLACE FUNCTION initialize_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_credits (user_id, credits, last_reset)
  VALUES (NEW.id, 5, CURRENT_DATE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to initialize credits when a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_credits();

-- Insert credits for existing users if they don't have any
INSERT INTO user_credits (user_id, credits, last_reset)
SELECT id, 5, CURRENT_DATE
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_credits); 