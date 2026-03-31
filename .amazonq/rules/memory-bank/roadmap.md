# Roadmap de Refatoração — Meu Treino

## Objetivo
Refatorar o projeto para usar as features do Next.js corretamente, separar responsabilidades, migrar para TypeScript e eventualmente migrar o banco de dados para Supabase.

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

### 🔄 Etapa 6 — Migração JS → TS (em andamento)

#### ✅ Concluído
- `src/utils/syncQueue.ts` — tipado
- `src/lib/firebase.ts` — tipado
- `src/lib/firestore.ts` — tipado
- `src/contexts/AuthContext.tsx` — interface + tipos adicionados (catch blocks pendentes)
- `src/hooks/useFirestoreSync.ts` — tipado
- `src/hooks/useWorkoutData.ts` — tipado
- `src/hooks/usePlans.ts` — tipado
- `src/hooks/useHistory.ts` — tipado
- `src/hooks/useWorkoutSession.ts` — tipado (undoExercise corrigido para usar closure)
- `src/hooks/useFinishedPlans.ts` — tipado
- `src/hooks/useWorkoutDerivedState.ts` — tipado
- `src/hooks/useRestTimer.ts` — tipado
- `src/app/layout.tsx` — tipado
- `src/app/page.tsx` — tipado
- `src/app/login/page.tsx` — tipado
- `src/components/ui/Header.tsx` — tipado
- `src/components/ui/TabBar.tsx` — tipado
- `src/components/ui/Providers.tsx` — tipado
- `src/components/ui/InstallPrompt.tsx` — tipado (cast EventListener pendente)
- `src/components/auth/Login.tsx` — tipado (catch blocks pendentes)
- `src/components/features/ExerciseAutocomplete.tsx` — tipado
- `src/components/features/RestTimer.tsx` — tipado
- `src/components/features/TimerButton.tsx` — tipado
- `src/components/features/HistoryView.tsx` — tipado
- `src/components/features/PlansView.tsx` — tipado

#### 🔲 Pendente
- `src/components/features/WorkoutView.tsx` — em andamento, erros de tipo nos catch blocks do `AuthContext` bloqueando o build
- `src/data/exerciseDatabase.js` — único arquivo ainda em `.js`

#### Erros de build pendentes
- `AuthContext.tsx` linha 66 — `error` é `unknown` nos catch blocks, precisa de cast para `FirebaseError` ou `Error`
- `InstallPrompt.tsx` — cast `handler as EventListener` pode precisar de ajuste

---

### 🔲 Etapa 1 (adiada) — API Routes com Firebase Admin
Motivo do adiamento: o Firebase Auth está 100% no cliente. Para usar API Routes com segurança real, é necessário:
- Instalar `firebase-admin`
- Verificar o ID Token do Firebase em cada API Route
- Usar variáveis de ambiente server-side (sem `NEXT_PUBLIC_`)

Será feito após a conclusão da migração para TypeScript e Supabase.

---

### 🔲 Etapa 7 — Migração para Supabase (Auth + dados)
Decisão: migrar **tudo** para o Supabase (Auth + banco), não apenas os dados.

**Motivo:** manter Firebase Auth + Supabase dados cria dois serviços para gerenciar e deixa o RLS sem segurança real (o JWT do Firebase não é reconhecido pelo Supabase nativamente).

**O que muda:**
| Arquivo | Mudança |
|---|---|
| `firebase.ts` | Remove `getFirestore`, mantém apenas Auth |
| `firestore.ts` | Reescrito como `supabase-db.ts` (mesmas assinaturas de função) |
| `AuthContext.tsx` | Reescrito para usar Supabase Auth (Google Sign-in nativo) |
| `useFirestoreSync.ts` | Import troca de `firestore.ts` para `supabase-db.ts` |
| `.env` | Troca variáveis Firebase pelo `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Supabase dashboard | Criar tabelas `workout_plans` e `workout_history` + RLS |

**Vantagens:**
- RLS funciona nativamente com o JWT do Supabase Auth
- Um serviço só, uma conta, um dashboard
- Geração automática de tipos TypeScript a partir do schema do banco

---

## Ordem de execução restante

| # | Etapa | Status |
|---|---|---|
| 1 | Terminar erros de build da Etapa 6 (AuthContext catch blocks, WorkoutView) | 🔄 Em andamento |
| 2 | Migrar `exerciseDatabase.js` → `.ts` | 🔲 |
| 3 | Migração para Supabase (Auth + dados) | 🔲 |
| 4 | API Routes com Firebase/Supabase Admin + verificação de token | 🔲 |
