-- Fix for Profile Role Issue
-- Run this in Supabase SQL Editor

-- Update the trigger to ensure role is always set
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'student')
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = COALESCE(profiles.role, 'student');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix any existing profiles that have NULL role
UPDATE profiles SET role = 'student' WHERE role IS NULL;

-- Ensure all auth users have profiles
INSERT INTO profiles (id, full_name, role)
SELECT id, raw_user_meta_data->>'full_name', 'student'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Test query to verify profiles
SELECT id, full_name, role, created_at FROM profiles LIMIT 10;
