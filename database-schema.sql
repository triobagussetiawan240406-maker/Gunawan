-- E-Learning Code Evaluator Database Schema
-- Copy and paste this SQL into your Supabase SQL Editor

-- Create problems table
CREATE TABLE IF NOT EXISTS problems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('python', 'javascript')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test_cases table
CREATE TABLE IF NOT EXISTS test_cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table for additional user data
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for problems (public read)
DROP POLICY IF EXISTS "Problems are viewable by everyone" ON problems;
CREATE POLICY "Problems are viewable by everyone" ON problems
  FOR SELECT USING (true);

-- Create policies for test_cases (public read)
DROP POLICY IF EXISTS "Test cases are viewable by everyone" ON test_cases;
CREATE POLICY "Test cases are viewable by everyone" ON test_cases
  FOR SELECT USING (true);

-- Create policies for submissions
DROP POLICY IF EXISTS "Users can view their own submissions" ON submissions;
CREATE POLICY "Users can view their own submissions" ON submissions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own submissions" ON submissions;
CREATE POLICY "Users can insert their own submissions" ON submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'student');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert sample problems
INSERT INTO problems (id, title, description, language) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Hitung Faktorial', 'Buat fungsi untuk menghitung faktorial dari suatu bilangan.

Input: angka
Output: faktorial dari angka tersebut

Contoh:
Input: 5
Output: 120', 'python'),
('550e8400-e29b-41d4-a716-446655440002', 'Cek Palindrome', 'Buat fungsi untuk mengecek apakah suatu string adalah palindrome.

Input: string
Output: YES jika palindrome, NO jika bukan

Contoh:
Input: racecar
Output: YES', 'python'),
('550e8400-e29b-41d4-a716-446655440003', 'Jumlah Array', 'Buat fungsi untuk menghitung jumlah semua elemen dalam array.

Input: array
Output: jumlah total

Contoh:
Input: [1,2,3,4,5]
Output: 15', 'javascript')
ON CONFLICT (id) DO NOTHING;

-- Insert test cases for factorial problem
INSERT INTO test_cases (problem_id, input, expected_output) VALUES
('550e8400-e29b-41d4-a716-446655440001', '5', '120'),
('550e8400-e29b-41d4-a716-446655440001', '0', '1'),
('550e8400-e29b-41d4-a716-446655440001', '3', '6')
ON CONFLICT DO NOTHING;

-- Insert test cases for palindrome problem
INSERT INTO test_cases (problem_id, input, expected_output) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'racecar', 'YES'),
('550e8400-e29b-41d4-a716-446655440002', 'hello', 'NO'),
('550e8400-e29b-41d4-a716-446655440002', 'level', 'YES')
ON CONFLICT DO NOTHING;

-- Insert test cases for array sum problem
INSERT INTO test_cases (problem_id, input, expected_output) VALUES
('550e8400-e29b-41d4-a716-446655440003', '[1,2,3,4,5]', '15'),
('550e8400-e29b-41d4-a716-446655440003', '[10,20,30]', '60'),
('550e8400-e29b-41d4-a716-446655440003', '[]', '0')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_problem_id ON test_cases(problem_id);