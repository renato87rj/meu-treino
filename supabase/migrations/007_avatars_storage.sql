-- Bucket público para avatares de usuário
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Política: usuário pode fazer upload/update/delete apenas na sua própria pasta
create policy "Avatar upload own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Avatar update own folder"
  on storage.objects for update
  using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Avatar delete own folder"
  on storage.objects for delete
  using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Leitura pública (avatares são públicos)
create policy "Avatar public read"
  on storage.objects for select
  using (bucket_id = 'avatars');
