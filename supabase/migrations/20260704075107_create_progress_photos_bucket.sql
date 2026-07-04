/*
# Create progress-photos storage bucket

1. Storage
- Creates a public storage bucket `progress-photos` for client progress photos
- Organized by client_id folders
2. Security
- Public read access for viewing photos
- Authenticated write access for trainers and clients
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read
DROP POLICY IF EXISTS "public_read_progress_photos" ON storage.objects;
CREATE POLICY "public_read_progress_photos" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'progress-photos');

-- Allow authenticated to upload
DROP POLICY IF EXISTS "auth_upload_progress_photos" ON storage.objects;
CREATE POLICY "auth_upload_progress_photos" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'progress-photos');

-- Allow authenticated to delete
DROP POLICY IF EXISTS "auth_delete_progress_photos" ON storage.objects;
CREATE POLICY "auth_delete_progress_photos" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'progress-photos');
