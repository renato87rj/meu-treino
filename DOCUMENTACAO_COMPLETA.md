# Documentação Completa - Meu Treino

## Visão Geral

**Meu Treino** é uma aplicação web de gerenciamento de treinos desenvolvida com Next.js 16, TypeScript e Supabase. O projeto permite que usuários criem fichas de treino, registram suas sessões de exercícios, acompanhem o histórico e sincronizem dados na nuvem.

---

## Stack Tecnológico

### Frontend
- **Next.js 16** - Framework React com App Router
- **React 19.2.0** - Biblioteca principal de UI
- **TypeScript 5.9.3** - Tipagem estática
- **TailwindCSS 4** - Framework de estilização
- **Lucide React** - Biblioteca de ícones

### Backend & Database
- **Supabase** - Banco de dados PostgreSQL + Auth + Realtime
- **Server Actions** - Manipulação de dados no backend
- **PostgreSQL** - Banco de dados relacional

### Autenticação
- **Supabase Auth** - Autenticação via Google OAuth
- **@supabase/ssr** - Client-side e server-side auth

### Ferramentas
- **ESLint** - Linting de código
- **PWA** - Progressive Web App capabilities
- **Fuse.js** - Busca fuzzy de exercícios

---

## Estrutura do Projeto

```
meu-treino/
├── src/
│   ├── app/                    # App Router Next.js
│   │   ├── actions/           # Server Actions
│   │   │   └── workout.ts     # CRUD de treinos
│   │   ├── login/             # Página de login
│   │   ├── layout.tsx         # Layout principal
│   │   └── page.tsx           # Dashboard
│   ├── components/            # Componentes React
│   │   ├── auth/              # Autenticação
│   │   ├── features/          # Funcionalidades principais
│   │   └── ui/                # Componentes genéricos
│   ├── contexts/              # React Contexts
│   ├── hooks/                 # Hooks customizados
│   ├── lib/                   # Bibliotecas utilitárias
│   ├── types/                 # Definições TypeScript
│   ├── utils/                 # Funções utilitárias
│   └── data/                  # Dados estáticos
├── supabase/                  # Configurações Supabase
│   ├── migrations/            # Migrações SQL
│   └── README.md             # Setup instructions
├── public/                    # Assets estáticos
└── docs/                     # Documentação
```

---

## Modelos de Dados

### Exercise
```typescript
interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: number | null;
  _substitute?: boolean;
  _sourcePlanName?: string;
  _originalName?: string;
}
```

### WorkoutPlan
```typescript
interface WorkoutPlan {
  id: string;
  name: string;
  exercises: Exercise[];
  createdAt: string;
  updatedAt: string;
}
```

### WorkoutRecord
```typescript
interface WorkoutRecord {
  id: string;
  planId: string;
  planName: string;
  exerciseId: string;
  exerciseName: string;
  plannedSets: number;
  plannedReps: string;
  plannedWeight: number | null;
  weight: number | null;
  completedSets: CompletedSet[];
  completed: boolean;
  substitute?: boolean;
  sourcePlanName?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  durationMinutes?: number;
}
```

---

## Funcionalidades Principais

### 1. Autenticação
- Login via Google OAuth
- Sessão gerenciada via cookies
- Middleware de proteção de rotas

### 2. Gestão de Fichas de Treino
- Criar/editar fichas de treino
- Adicionar exercícios com sets, reps e peso
- Busca de exercícios com autocomplete
- Substituição de exercícios durante o treino

### 3. Execução de Treinos
- Interface de treino com timer de descanso
- Registro progressivo de séries
- Controle de peso e repetições
- Marcação de exercícios como concluídos

### 4. Histórico e Progresso
- Registro detalhado de sessões
- Visualização de histórico por data
- Métricas de duração e volume
- Agrupamento por ficha

### 5. Sincronização
- Sincronização automática com Supabase
- Suporte offline com localStorage
- Conflito resolution

---

## Arquitetura

### Server Actions
As operações de CRUD são executadas via Server Actions em `src/app/actions/workout.ts`:

- `loadWorkoutPlansAction()` - Carrega fichas do usuário
- `loadWorkoutHistoryAction()` - Carrega histórico
- `upsertWorkoutPlanAction()` - Cria/atualiza ficha
- `deleteWorkoutPlanAction()` - Remove ficha
- `upsertWorkoutHistoryAction()` - Registra treino
- `deleteWorkoutHistoryAction()` - Remove registro
- `syncAllDataAction()` - Sincronização em lote

### Hooks Customizados
- `usePlans()` - Gestão de fichas
- `useHistory()` - Gestão de histórico
- `useWorkoutSession()` - Sessão ativa
- `useWorkoutData()` - Orquestração principal
- `useRestTimer()` - Timer de descanso

### Componentes Principais
- `PlansView` - Listagem e edição de fichas
- `WorkoutView` - Interface de treino ativo
- `HistoryView` - Visualização de histórico
- `ExerciseAutocomplete` - Busca de exercícios
- `RestTimer` - Timer de descanso

---

## Banco de Dados

### Tabelas Principais

#### workout_plans
```sql
create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

#### workout_history
```sql
create table public.workout_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid not null,
  plan_name text not null,
  exercise_id text not null,
  exercise_name text not null,
  planned_sets int not null,
  planned_reps text not null,
  planned_weight numeric,
  weight numeric,
  completed_sets jsonb not null default '[]'::jsonb,
  completed boolean not null default true,
  substitute boolean default false,
  source_plan_name text,
  record_date timestamptz not null,
  duration_minutes int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Segurança
- **Row Level Security (RLS)** ativado em todas as tabelas
- Políticas que garantem acesso apenas aos dados do usuário
- Autenticação via JWT do Supabase

---

## Configuração e Setup

### 1. Variáveis de Ambiente
Copie `.env.example` para `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### 2. Setup Supabase
1. Crie projeto em [supabase.com](https://supabase.com)
2. Execute migration SQL em `supabase/migrations/001_workout_tables.sql`
3. Configure Google OAuth em Authentication → Providers
4. Adicione redirect URLs: `http://localhost:3000/auth/callback`

### 3. Instalação e Execução
```bash
# Instalar dependências
npm install

# Executar desenvolvimento
npm run dev

# Build para produção
npm run build
```

---

## Deploy

### Vercel (Recomendado)
1. Conecte repositório ao Vercel
2. Configure variáveis de ambiente
3. Deploy automático a cada push

### Outras Plataformas
- Railway, Render, Netlify
- Necessário configurar build command: `npm run build`
- Variáveis de ambiente obrigatórias

---

## Funcionalidades PWA

- Manifest.json para instalação
- Service Worker para cache
- Install Prompt para usuários mobile
- Offline-first approach

---

## Performance e Otimizações

### Frontend
- Code splitting via Next.js
- Imagens otimizadas
- Lazy loading de componentes
- Cache estratégico

### Backend
- Server Actions para redução de payload
- Índices otimizados no PostgreSQL
- RLS para segurança eficiente
- Conexões reutilizáveis

---

## Segurança

### Autenticação
- OAuth 2.0 via Google
- JWT tokens com expiração
- Session management via cookies
- Middleware de proteção

### Dados
- RLS em nível de banco
- Validação de inputs
- Sanitização de dados
- HTTPS obrigatório

---

## Roadmap e Futuras Melhorias

### Short Term
- [ ] Exportação de dados (CSV/JSON)
- [ ] Gráficos de progresso
- [ ] Notificações push
- [ ] Dark mode

### Medium Term
- [ ] Compartilhamento de fichas
- [ ] Integração com wearables
- [ ] Análise avançada de performance
- [ ] Desafios e metas

### Long Term
- [ ] IA para recomendações
- [ ] Comunidade e social features
- [ ] Integração com nutricionistas
- [ ] Versão mobile nativa

---

## Contribuição

### Setup de Desenvolvimento
1. Fork do repositório
2. Clone local
3. Configurar `.env.local`
4. `npm install && npm run dev`

### Padrões
- TypeScript para todo código novo
- Componentes reutilizáveis
- Testes unitários em features críticas
- Commits semânticos

---

## Troubleshooting

### Issues Comuns
1. **Auth redirect loop** - Verificar configuração OAuth
2. **CORS errors** - Configurar URLs permitidas no Supabase
3. **Build errors** - Verificar tipos TypeScript
4. **Database connection** - Validar variáveis de ambiente

### Logs e Debug
- Console errors no browser
- Server logs em Vercel/Railway
- Supabase dashboard logs
- Network tab para requests

---

## Contato e Suporte

- Issues no GitHub
- Documentação em `/docs`
- Roadmap em `roadmap.md`
- Exemplos em `/examples`

---

*Última atualização: Abril 2026*
*Versão: 0.1.0*
