# 📋 Plano de Refatoração - Dashboard.tsx

## 📊 Análise Atual
- **Linhas totais:** 1157
- **Problemas identificados:**
  - Muitas responsabilidades em um único arquivo
  - Lógica de negócio misturada com UI
  - Componentes inline que podem ser extraídos
  - Hooks e utilitários que podem ser reutilizados

## 🎯 Objetivo
Reduzir o Dashboard.tsx para aproximadamente **300-400 linhas** através de:
1. Extração de componentes
2. Criação de hooks customizados
3. Separação de lógica de negócio em utilitários

---

## 📦 Estrutura Proposta

### 1. Componentes a Extrair

#### `AddLatePlayerModal.tsx` (~70 linhas)
- **Localização:** `src/components/dashboard/AddLatePlayerModal.tsx`
- **Responsabilidade:** Modal para adicionar jogadores que chegaram tarde
- **Status:** ✅ Já existe inline no Dashboard

#### `TimerControls.tsx` (~80 linhas)
- **Localização:** `src/components/dashboard/TimerControls.tsx`
- **Responsabilidade:** Componente do cronômetro com controles (play/pause/reset)
- **Linhas atuais:** 961-1014

#### `QueueSection.tsx` (~150 linhas)
- **Localização:** `src/components/dashboard/QueueSection.tsx`
- **Responsabilidade:** Seção que mostra a fila de espera durante a partida
- **Linhas atuais:** 1042-1154

#### `MatchControls.tsx` (~30 linhas)
- **Localização:** `src/components/dashboard/MatchControls.tsx`
- **Responsabilidade:** Botões de controle da partida (Encerrar, Finalizar Dia)
- **Linhas atuais:** 1015-1028

---

### 2. Hooks Customizados

#### `useMatchTimer.ts` (~50 linhas)
- **Localização:** `src/hooks/useMatchTimer.ts`
- **Responsabilidade:** Gerencia lógica do cronômetro (interval, pause, resume)
- **Linhas atuais:** 790-818

#### `useMatchState.ts` (~100 linhas)
- **Localização:** `src/hooks/useMatchState.ts`
- **Responsabilidade:** Gerencia estado da partida (score, stats, events)
- **Funções:** `handleConfirmGoal`, `handleEventDeleted`, `handleEndMatch`

#### `useDraftState.ts` (~80 linhas)
- **Localização:** `src/hooks/useDraftState.ts`
- **Responsabilidade:** Gerencia estado do draft (red, blue, queue)
- **Funções:** `handleSmartShuffleDraft`, `movePlayer`, `handleQueueReorder`

#### `useLobbyState.ts` (~60 linhas)
- **Localização:** `src/hooks/useLobbyState.ts`
- **Responsabilidade:** Gerencia estado do lobby (selectedIds, ordem)
- **Funções:** `handleToggleLobby`, `handleMoveUp`, `handleMoveDown`

#### `useMatchData.ts` (~120 linhas)
- **Localização:** `src/hooks/useMatchData.ts`
- **Responsabilidade:** Carrega dados iniciais (players, activeMatch, lobbyOrder)
- **Linhas atuais:** 152-272

---

### 3. Utilitários

#### `matchUtils.ts` (~100 linhas)
- **Localização:** `src/utils/matchUtils.ts`
- **Funções:**
  - `buildQueueTeams(players: Player[]): Team[]` - Constrói times da fila
  - `reorderQueue(queue: Player[], playerId: string, direction: "up" | "down"): Player[]` - Reordena fila
  - `calculateNextTeams(winner, loser, queue, selectedIds): {red, blue, queue}` - Calcula próximos times
  - `formatTeamsForShare(draftState): string` - Formata times para compartilhamento

#### `statsUtils.ts` (~40 linhas)
- **Localização:** `src/utils/statsUtils.ts`
- **Funções:**
  - `calculateStatsFromEvents(events): Record<string, PlayerStats>` - Calcula stats de eventos
  - `updateStatsOnGoal(stats, scorerId, assistId): Record<string, PlayerStats>` - Atualiza stats

---

## 📈 Estimativa de Redução

| Arquivo | Linhas Atuais | Linhas Após |
|---------|---------------|-------------|
| Dashboard.tsx | 1157 | ~350 |
| AddLatePlayerModal.tsx | 0 (inline) | ~70 |
| TimerControls.tsx | 0 (inline) | ~80 |
| QueueSection.tsx | 0 (inline) | ~150 |
| MatchControls.tsx | 0 (inline) | ~30 |
| useMatchTimer.ts | 0 (inline) | ~50 |
| useMatchState.ts | 0 (inline) | ~100 |
| useDraftState.ts | 0 (inline) | ~80 |
| useLobbyState.ts | 0 (inline) | ~60 |
| useMatchData.ts | 0 (inline) | ~120 |
| matchUtils.ts | 0 | ~100 |
| statsUtils.ts | 0 | ~40 |

**Total:** ~1157 → ~1230 linhas (mas muito mais organizado e reutilizável!)

---

## 🚀 Ordem de Implementação

1. ✅ Criar utilitários (`matchUtils.ts`, `statsUtils.ts`)
2. ✅ Extrair componentes simples (`AddLatePlayerModal`, `TimerControls`, `MatchControls`)
3. ✅ Criar hooks (`useMatchTimer`, `useLobbyState`, `useDraftState`)
4. ✅ Extrair componente complexo (`QueueSection`)
5. ✅ Criar hook de dados (`useMatchData`)
6. ✅ Criar hook de estado da partida (`useMatchState`)
7. ✅ Refatorar Dashboard.tsx usando tudo acima

---

## ✨ Benefícios

- **Manutenibilidade:** Cada arquivo tem uma responsabilidade clara
- **Reutilização:** Hooks e utilitários podem ser usados em outros lugares
- **Testabilidade:** Funções isoladas são mais fáceis de testar
- **Legibilidade:** Dashboard.tsx fica muito mais limpo e fácil de entender
- **Performance:** Hooks podem otimizar re-renders com `useMemo` e `useCallback`
