-- Add Admin INSERT Policy for Problems Table
-- Run this in Supabase SQL Editor to allow admins to create new problems

-- Drop existing policies if any
DROP POLICY IF EXISTS "Only admins can insert problems" ON problems;
DROP POLICY IF EXISTS "Only admins can update problems" ON problems;
DROP POLICY IF EXISTS "Only admins can delete problems" ON problems;

-- Create policy to allow admins to INSERT problems
CREATE POLICY "Only admins can insert problems" ON problems
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create policy to allow admins to UPDATE problems
CREATE POLICY "Only admins can update problems" ON problems
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create policy to allow admins to DELETE problems
CREATE POLICY "Only admins can delete problems" ON problems
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create policy to allow admins to INSERT test cases
DROP POLICY IF EXISTS "Only admins can insert test cases" ON test_cases;
CREATE POLICY "Only admins can insert test cases" ON test_cases
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create policy to allow admins to DELETE test cases
DROP POLICY IF EXISTS "Only admins can delete test cases" ON test_cases;
CREATE POLICY "Only admins can delete test cases" ON test_cases
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Verify policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('problems', 'test_cases')
ORDER BY tablename, policyname;
