-- DEV-ONLY test points for the local database. Loaded by `supabase db reset`
-- (config.toml [db.seed]). NEVER push to the remote project:
-- do not use `supabase db push --include-seed`.
-- Fictitious content and arbitrary coordinates; no historical meaning.

insert into public.point (id, slug, title, summary, body, location, city, heritage, status, sensitivity) values
  ('00000000-0000-0000-0000-00000000d001', 'teste-1', '[CONTEÚDO DE TESTE — NÃO PUBLICAR] Ponto 1',
   '[CONTEÚDO DE TESTE — NÃO PUBLICAR]', '[CONTEÚDO DE TESTE — NÃO PUBLICAR]',
   'SRID=4326;POINT(-46.6355 -23.5578)', 'Teste', 'ambas', 'publicado', 'aberto'),
  ('00000000-0000-0000-0000-00000000d002', 'teste-2', '[CONTEÚDO DE TESTE — NÃO PUBLICAR] Ponto 2',
   '[CONTEÚDO DE TESTE — NÃO PUBLICAR]', '[CONTEÚDO DE TESTE — NÃO PUBLICAR]',
   'SRID=4326;POINT(-46.6312 -23.5612)', 'Teste', 'ambas', 'publicado', 'aberto'),
  ('00000000-0000-0000-0000-00000000d003', 'teste-3', '[CONTEÚDO DE TESTE — NÃO PUBLICAR] Ponto 3',
   '[CONTEÚDO DE TESTE — NÃO PUBLICAR]', '[CONTEÚDO DE TESTE — NÃO PUBLICAR]',
   'SRID=4326;POINT(-46.6930 -23.5665)', 'Teste', 'ambas', 'publicado', 'aberto'),
  ('00000000-0000-0000-0000-00000000d004', 'teste-4', '[CONTEÚDO DE TESTE — NÃO PUBLICAR] Ponto 4',
   '[CONTEÚDO DE TESTE — NÃO PUBLICAR]', '[CONTEÚDO DE TESTE — NÃO PUBLICAR]',
   'SRID=4326;POINT(-47.8828 -15.7939)', 'Teste', 'ambas', 'publicado', 'aberto');
