# Supabase (Etapa 7)

1. Crie um projeto em [supabase.com](https://supabase.com) e copie **URL** e **anon key** para `.env.local` (veja `.env.example` na raiz do app).
2. No **SQL Editor**, execute o conteúdo de `migrations/001_workout_tables.sql` (ou use a CLI `supabase db push` se usar link local).
3. Em **Authentication → Providers**, habilite **Google** e configure redirect URLs: `http://localhost:3000/auth/callback` e o domínio de produção equivalente.

## Migração Firestore → Postgres

Dados antigos no Firebase exigem script próprio (export JSON + insert com `service_role`). Não faz parte do build da aplicação.
