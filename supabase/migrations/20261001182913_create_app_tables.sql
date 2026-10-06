/*
# Create core tables for RedSolidaria

1. New Tables
- `profiles` — user profile data (uid, email, display_name, avatar_url, created_at)
- `campaigns` — user-created fundraising campaigns with PayPal email
- `chat_messages` — real-time community chat messages
- `chat_typing` — typing indicator for chat (single row, keyed by user)
- `posts` — community feed posts
- `reports` — content moderation reports for posts

2. Security
- profiles: authenticated users can read all, update own
- campaigns: public read (anon + authenticated), authenticated create, owner update/delete
- chat_messages: authenticated read + create own, update/delete own
- chat_typing: authenticated read + write
- posts: authenticated read + create own, update/delete own
- reports: authenticated read + create, no delete

3. Notes
- All owner columns default to auth.uid() so inserts work without passing user_id
- Campaigns are publicly viewable (anon can read) so non-logged-in visitors can see them
- Email confirmation is OFF — users can register and immediately log in
*/

-- ── profiles ──
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL,
  avatar_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = uid);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = uid) WITH CHECK (auth.uid() = uid);

-- ── campaigns ──
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descripcion text NOT NULL,
  meta_monto numeric NOT NULL DEFAULT 0,
  recaudado_monto numeric NOT NULL DEFAULT 0,
  imagen_url text NOT NULL DEFAULT '',
  creador_uid uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  creador_nombre text NOT NULL,
  creador_email text NOT NULL,
  paypal_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "campaigns_select_public" ON campaigns;
CREATE POLICY "campaigns_select_public" ON campaigns FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "campaigns_insert_own" ON campaigns;
CREATE POLICY "campaigns_insert_own" ON campaigns FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = creador_uid);

DROP POLICY IF EXISTS "campaigns_update_own" ON campaigns;
CREATE POLICY "campaigns_update_own" ON campaigns FOR UPDATE
  TO authenticated USING (auth.uid() = creador_uid) WITH CHECK (auth.uid() = creador_uid);

DROP POLICY IF EXISTS "campaigns_delete_own" ON campaigns;
CREATE POLICY "campaigns_delete_own" ON campaigns FOR DELETE
  TO authenticated USING (auth.uid() = creador_uid);

-- ── chat_messages ──
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_uid uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_avatar text NOT NULL DEFAULT '',
  text text NOT NULL DEFAULT '',
  media jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_select_auth" ON chat_messages;
CREATE POLICY "chat_messages_select_auth" ON chat_messages FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "chat_messages_insert_own" ON chat_messages;
CREATE POLICY "chat_messages_insert_own" ON chat_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = author_uid);

DROP POLICY IF EXISTS "chat_messages_update_own" ON chat_messages;
CREATE POLICY "chat_messages_update_own" ON chat_messages FOR UPDATE
  TO authenticated USING (auth.uid() = author_uid) WITH CHECK (auth.uid() = author_uid);

DROP POLICY IF EXISTS "chat_messages_delete_own" ON chat_messages;
CREATE POLICY "chat_messages_delete_own" ON chat_messages FOR DELETE
  TO authenticated USING (auth.uid() = author_uid);

-- ── chat_typing ──
CREATE TABLE IF NOT EXISTS chat_typing (
  id text PRIMARY KEY DEFAULT 'global',
  uid uuid,
  name text,
  is_typing boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_typing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_typing_select_auth" ON chat_typing;
CREATE POLICY "chat_typing_select_auth" ON chat_typing FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "chat_typing_write_auth" ON chat_typing;
CREATE POLICY "chat_typing_write_auth" ON chat_typing FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "chat_typing_update_auth" ON chat_typing;
CREATE POLICY "chat_typing_update_auth" ON chat_typing FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "chat_typing_delete_auth" ON chat_typing;
CREATE POLICY "chat_typing_delete_auth" ON chat_typing FOR DELETE
  TO authenticated USING (true);

-- ── posts ──
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_uid uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_avatar text NOT NULL DEFAULT '',
  text text NOT NULL DEFAULT '',
  media jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select_auth" ON posts;
CREATE POLICY "posts_select_auth" ON posts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "posts_insert_own" ON posts;
CREATE POLICY "posts_insert_own" ON posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = author_uid);

DROP POLICY IF EXISTS "posts_update_own" ON posts;
CREATE POLICY "posts_update_own" ON posts FOR UPDATE
  TO authenticated USING (auth.uid() = author_uid) WITH CHECK (auth.uid() = author_uid);

DROP POLICY IF EXISTS "posts_delete_own" ON posts;
CREATE POLICY "posts_delete_own" ON posts FOR DELETE
  TO authenticated USING (auth.uid() = author_uid);

-- ── reports ──
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select_auth" ON reports;
CREATE POLICY "reports_select_auth" ON reports FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "reports_insert_own" ON reports;
CREATE POLICY "reports_insert_own" ON reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reported_by);

-- ── indexes ──
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages (created_at ASC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_post_id ON reports (post_id);
