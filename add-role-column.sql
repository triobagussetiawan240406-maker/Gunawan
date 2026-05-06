-- Add role column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin'));

-- Update any existing rows that have NULL role
UPDATE profiles SET role = 'student' WHERE role IS NULL;

-- Recreate the trigger with proper handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'student')
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(profiles.role, 'student');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Verify the column exists and has correct constraint
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'role';

-- Insert profiles for any auth users that don't have profiles
INSERT INTO profiles (id, full_name, role)
SELECT id, raw_user_meta_data->>'full_name', 'student'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Verify the result
SELECT COUNT(*) as total_profiles, 
       COUNT(CASE WHEN role IS NULL THEN 1 END) as null_roles,
       COUNT(CASE WHEN role = 'student' THEN 1 END) as student_count,
       COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count
FROM profiles;
