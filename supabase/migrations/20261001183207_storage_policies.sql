/*
# Storage policies for chat-media and post-media buckets

1. Security
- chat-media: authenticated users can upload, everyone can read (public bucket)
- post-media: authenticated users can upload, everyone can read (public bucket)
*/

CREATE POLICY "chat_media_read_public" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'chat-media');

CREATE POLICY "chat_media_upload_auth" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-media');

CREATE POLICY "post_media_read_public" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'post-media');

CREATE POLICY "post_media_upload_auth" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-media');
