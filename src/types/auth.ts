import { User } from "@supabase/supabase-js";

export interface AuthUser extends User {
  user_metadata: {
    avatar_url: string;
    email: string;
    full_name: string;
    name: string;
    picture: string;
    provider_id: string;
    sub: string;
  };
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}
