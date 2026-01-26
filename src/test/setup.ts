import "@testing-library/jest-dom";

// Set up test environment variables to prevent Supabase client initialization errors
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
