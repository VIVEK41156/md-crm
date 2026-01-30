-- Create blogs table
CREATE TABLE blogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT,
  feature_image TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_blogs_author ON blogs(author_id);
CREATE INDEX idx_blogs_category ON blogs(category);
CREATE INDEX idx_blogs_status ON blogs(status);
CREATE INDEX idx_blogs_published ON blogs(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_blogs_tags ON blogs USING GIN(tags);

-- RLS Policies
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Everyone can view published blogs
CREATE POLICY "Anyone can view published blogs" ON blogs
  FOR SELECT USING (status = 'published');

-- Authenticated users can view all blogs
CREATE POLICY "Authenticated users can view all blogs" ON blogs
  FOR SELECT TO authenticated USING (true);

-- Admins can do everything
CREATE POLICY "Admins can manage all blogs" ON blogs
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Authors can manage their own blogs
CREATE POLICY "Authors can manage their own blogs" ON blogs
  FOR ALL TO authenticated USING (author_id = auth.uid());

-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog_images', 'blog_images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for blog images
CREATE POLICY "Anyone can view blog images" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog_images');

CREATE POLICY "Authenticated users can upload blog images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'blog_images');

CREATE POLICY "Users can update their own blog images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'blog_images');

CREATE POLICY "Users can delete their own blog images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'blog_images');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blogs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blogs_updated_at
  BEFORE UPDATE ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION update_blogs_updated_at();