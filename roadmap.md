# Roadmap de Refatoração — Meu Treino

## Objetivo
Refatorar o projeto para usar as features do Next.js corretamente, separar responsabilidades, migrar para TypeScript (concluído), migrar Auth e dados para o Supabase (concluído) e concentrar a manipulação de dados no backend (Server Actions / servidor Next.js).

---

## Etapas

### ✅ Etapa 2 — Reorganização de pastas
Movidos os componentes para subpastas com responsabilidade clara:
```
src/components/
  auth/
    Login.tsx
  features/
    PlansView.tsx
    WorkoutView.tsx
    HistoryView.tsx
    ExerciseAutocomplete.tsx
    RestTimer.tsx
    TimerButton.tsx
  ui/
    Header.tsx
    TabBar.tsx
    InstallPrompt.tsx
    Providers.tsx
```
Todos os imports foram atualizados. Build passou sem erros.

---

### ✅ Etapa 3 — Quebra do useWorkoutData em hooks menores
O hook monolítico foi dividido em:
- `usePlans.ts` — CRUD de fichas e exercícios
- `useHistory.ts` — histórico, registros, agrupamento
- `useWorkoutSession.ts` — progresso de séries, substitutos, completar/desfazer
- `useWorkoutData.ts` — orquestra os 3 hooks + localStorage + listeners + online/offline

O retorno público do `useWorkoutData` permanece idêntico — nenhum componente foi alterado.

---

### ✅ Etapa 4 — Enxugamento do page.js
Extraída lógica do `page.js` para dois hooks novos:
- `useFinishedPlans.ts` — fichas concluídas hoje (localStorage)
- `useWorkoutDerivedState.ts` — estado derivado do treino ativo (todayRecords, completedTodayIds, etc.)

O `page.tsx` ficou responsável apenas por orquestrar views e estado de navegação.

---

### ✅ Etapa 5 — Instalação do TypeScript e criação dos tipos
- Instalado `typescript`, `@types/react`, `@types/node`, `@types/react-dom`
- Criado `tsconfig.json` com `allowJs: true` para migração gradual
- Criados os tipos de domínio em `src/types/`:
  - `workout.ts` — `Exercise`, `WorkoutPlan`, `WorkoutRecord`, `SetProgressMap`, `SubstituteExercisesMap`
  - `auth.ts` — `AuthUser`, `AuthResult`
  - `sync.ts` — `SyncOperation`, `SyncQueueItem`

---

### ✅ Etapa 6 — Migração JS → TS
Código de aplicação migrado para TypeScript; build consistente com os tipos de domínio em `src/types/`.

- `src/utils/syncQueue.ts`
- `src/lib/firebase.ts`
- `src/lib/firestore.ts`
- `src/contexts/AuthContext.tsx`
- `src/hooks/useFirestoreSync.ts`
- `src/hooks/useWorkoutData.ts`
- `src/hooks/usePlans.ts`
- `src/hooks/useHistory.ts`
- `src/hooks/useWorkoutSession.ts` (undoExercise ajustado para usar closure)
- `src/hooks/useFinishedPlans.ts`
- `src/hooks/useWorkoutDerivedState.ts`
- `src/hooks/useRestTimer.ts`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/login/page.tsx`
- `src/components/ui/Header.tsx`
- `src/components/ui/TabBar.tsx`
- `src/components/ui/Providers.tsx`
- `src/components/ui/InstallPrompt.tsx`
- `src/components/auth/Login.tsx`
- `src/components/features/ExerciseAutocomplete.tsx`
- `src/components/features/RestTimer.tsx`
- `src/components/features/TimerButton.tsx`
- `src/components/features/HistoryView.tsx`
- `src/components/features/PlansView.tsx`
- `src/components/features/WorkoutView.tsx`
- `src/data/exerciseDatabase.ts`

---

### ✅ Etapa 7 — Migração para Supabase (Auth + dados) e dados no backend
Decisão: migrar **tudo** para o Supabase (Auth + banco), não apenas os dados.

**Motivo:** manter Firebase Auth + Supabase dados cria dois serviços para gerenciar e deixa o RLS sem segurança real (o JWT do Firebase não é reconhecido pelo Supabase nativamente).

**Implementado:**
| Área | Detalhe |
|---|---|
| Auth | `AuthContext` + `@supabase/ssr` browser client; Google via OAuth redirect (`/auth/callback`) |
| Dados | Server Actions em `src/app/actions/workout.ts`; IDs **UUID** em domínio e Postgres |
| Sync | `useFirestoreSync` chama actions; carga inicial + migração local sem listeners Firestore |
| Config | `.env.example`; SQL em `supabase/migrations/001_workout_tables.sql` + `supabase/README.md` |
| Removido | `firebase`, `src/lib/firebase.ts`, `src/lib/firestore.ts` |

**Vantagens:**
- RLS funciona nativamente com o JWT do Supabase Auth
- Um serviço só, uma conta, um dashboard
- Geração automática de tipos TypeScript a partir do schema do banco

**Após a migração — manipulação de dados no backend:**  
Objetivo: leituras/escritas que hoje partem do cliente com Supabase anon passarem a ser feitas no servidor (cliente Supabase **server-side** com sessão/cookies, chaves sensíveis só em variáveis **sem** `NEXT_PUBLIC_`, RLS continuando a valer com o JWT do usuário).

**Formato recomendado — Server Actions em primeiro lugar:**  
No App Router, o padrão mais alinhado ao Next.js é usar **Server Actions** (`'use server'`) para mutações e para buscas disparadas pela UI: uma função por operação, tipagem ponta a ponta, integração com `@supabase/ssr` e cookies de sessão, sem expor a *service role* ao browser. É o melhor encaixe para um app React que só precisa falar com o próprio backend.

**Quando usar Route Handlers (`app/api/.../route.ts`):**  
Webhooks (Stripe, etc.), integrações que exigem HTTP explícito (verbos, headers, cache), clientes fora do React (mobile nativo, scripts) ou contrato REST público. Para o fluxo interno do Meu Treino, isso tende a ser exceção.

**Resumo:** **Server Actions como padrão** para o CRUD e regras de negócio após o Supabase; **API Routes** só onde HTTP genérico ou integrações externas forem necessários.

---

## Ordem de execução restante

| # | Etapa | Status |
|---|---|---|
| — | (Nenhuma etapa pendente no roadmap atual) | — |
