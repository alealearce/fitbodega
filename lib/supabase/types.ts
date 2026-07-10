export type ListingType = 'gym' | 'trainer' | 'recovery' | 'club' | 'nutritionist' | 'store' | 'youth';
export type ListingStatus = 'pending' | 'approved' | 'rejected';
export type ListingPlan = 'free' | 'verified' | 'pro';

export interface Listing {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  slug: string;
  type: ListingType;
  description: string | null;
  long_description: string | null;
  tagline: string | null;
  logo_url: string | null;
  images: string[];
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  specialties: string[];
  experience_levels: string[];
  languages: string[];
  price_range: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_youtube: string | null;
  status: ListingStatus;
  is_featured: boolean;
  is_verified: boolean;
  owner_id: string | null;
  view_count: number;
  rating_avg: number;
  rating_count: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: ListingPlan;
  plan_expires_at: string | null;
  certification_id: string | null;
  last_featured_at: string | null;
}

export interface Review {
  id: string;
  created_at: string;
  listing_id: string;
  user_id: string | null;
  user_name: string;
  rating: number;
  body: string;
  is_approved: boolean;
}

export interface BlogPost {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  author: string;
  author_avatar: string | null;
  cover_image: string | null;
  tags: string[];
  is_published: boolean;
  reading_time_minutes: number | null;
  category: string | null;
  city: string | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  generated_by: string | null;
}

export interface NewsletterSubscriber {
  id: string;
  created_at: string;
  email: string;
  is_confirmed: boolean;
  confirmed_at: string | null;
  unsubscribe_token: string;
}

export interface Lead {
  id: string;
  created_at: string;
  listing_id: string;
  sender_name: string;
  sender_email: string;
  message: string;
  is_read: boolean;
}

export interface Profile {
  id: string; // uuid references auth.users
  created_at: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

// ── Supabase Database type map ─────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      listings: {
        Row: Listing;
        Insert: Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'rating_avg' | 'rating_count'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          view_count?: number;
          rating_avg?: number;
          rating_count?: number;
        };
        Update: Partial<Omit<Listing, 'id' | 'created_at'>>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Review, 'id' | 'created_at'>>;
      };
      blog_posts: {
        Row: BlogPost;
        Insert: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<BlogPost, 'id' | 'created_at'>>;
      };
      newsletter_subscribers: {
        Row: NewsletterSubscriber;
        Insert: Omit<NewsletterSubscriber, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<NewsletterSubscriber, 'id' | 'created_at'>>;
      };
      leads: {
        Row: Lead;
        Insert: Omit<Lead, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Lead, 'id' | 'created_at'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
    };
  };
}
