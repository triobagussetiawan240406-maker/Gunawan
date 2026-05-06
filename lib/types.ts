export interface Problem {
  id: string
  title: string
  description: string
  language: 'python' | 'javascript'
  test_cases?: TestCase[]
}

export interface TestCase {
  id: string
  input: string
  expected_output: string
}

export interface Submission {
  id: string
  user_id: string
  problem_id: string
  code: string
  result: {
    passed: number
    total: number
    status: 'passed' | 'failed'
    details: Array<{
      test_id: string
      passed: boolean
      input: string
      output: string
      expected: string
    }>
  }
  created_at: string
}

export interface Feedback {
  message: string
  category: 'logic' | 'input' | 'loop' | 'output' | 'syntax' | 'success'
}

export interface User {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
  }
}

export interface UserProfile {
  id: string
  full_name: string
  role: 'student' | 'admin'
  created_at: string
  updated_at: string
}
