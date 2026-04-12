-- Create the plant-images storage bucket (public so image URLs work without auth headers)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'plant-images',
  'plant-images',
  true,
  5242880, -- 5 MB max per image
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Users can upload images only into their own folder ({userId}/...)
drop policy if exists "Users can upload own plant images" on storage.objects;
create policy "Users can upload own plant images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'plant-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Anyone can view images (needed for public <img src="..."> to work)
drop policy if exists "Anyone can view plant images" on storage.objects;
create policy "Anyone can view plant images"
on storage.objects for select
using (bucket_id = 'plant-images');

-- Users can replace their own images
drop policy if exists "Users can update own plant images" on storage.objects;
create policy "Users can update own plant images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'plant-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own images
drop policy if exists "Users can delete own plant images" on storage.objects;
create policy "Users can delete own plant images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'plant-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
