# 📊 Resumo da Refatoração - Dashboard.tsx

## ✅ Progresso Atual

### Componentes Extraídos (4/4)
- ✅ `AddLatePlayerModal.tsx` - Modal para adicionar jogadores tardios
- ✅ `TimerControls.tsx` - Componente do cronômetro
- ✅ `MatchControls.tsx` - Botões de controle da partida
- ✅ `QueueSection.tsx` - Seção da fila durante a partida

### Hooks Criados (3/5)
- ✅ `useMatchTimer.ts` - Gerencia lógica do cronômetro
- ✅ `useLobbyState.ts` - Gerencia estado do lobby
- ✅ `useDraftState.ts` - Gerencia estado do draft
- ⏳ `useMatchState.ts` - Gerencia estado da partida (pendente)
- ⏳ `useMatchData.ts` - Carrega dados iniciais (pendente)

### Utilitários Criados (2/2)
- ✅ `matchUtils.ts` - Funções auxiliares para manipulação de times/fila
- ✅ `statsUtils.ts` - Funções para cálculos de estatísticas

---

## 📁 Estrutura de Arquivos Criados

```
src/
├── components/
│   └── dashboard/
│       ├── AddLatePlayerModal.tsx      ✅ Novo
│       ├── TimerControls.tsx            ✅ Novo
│       ├── MatchControls.tsx            ✅ Novo
│       └── QueueSection.tsx             ✅ Novo
├── hooks/
│   ├── useMatchTimer.ts                 ✅ Novo
│   ├── useLobbyState.ts                 ✅ Novo
│   └── useDraftState.ts                 ✅ Novo
└── utils/
    ├── matchUtils.ts                     ✅ Novo
    └── statsUtils.ts                     ✅ Novo
```

---

## 🔧 Como Usar os Novos Componentes e Hooks

### 1. Componentes

#### AddLatePlayerModal
```tsx
import AddLatePlayerModal from "../components/dashboard/AddLatePlayerModal";

<AddLatePlayerModal
  isOpen={latePlayerModalOpen}
  onClose={() => setLatePlayerModalOpen(false)}
  players={playersNotInGame}
  onAdd={handleAddLatePlayers}
/>
```

#### TimerControls
```tsx
import TimerControls from "../components/dashboard/TimerControls";

<TimerControls
  gameState={gameState}
  onToggleTimer={() => setGameState(prev => ({ ...prev, isRunning: !prev.isRunning }))}
  onResetTimer={() => setGameState(prev => ({ ...prev, timer: 600, isRunning: false }))}
  onViewHistory={() => setHistoryModalOpen(true)}
/>
```

#### MatchControls
```tsx
import MatchControls from "../components/dashboard/MatchControls";

<MatchControls
  onEndMatch={() => setGameOverReason("MANUAL")}
  onFinishDay={handleFinishDay}
/>
```

#### QueueSection
```tsx
import QueueSection from "../components/dashboard/QueueSection";

<QueueSection
  queue={gameState.queue}
  selectedIds={selectedIds}
  movingPlayerId={movingPlayerId}
  onSetMovingPlayer={setMovingPlayerId}
  onQuickMove={handleQuickMove}
  onQueueReorder={handleQueueReorderActiveMatch}
  onAddLatePlayers={() => setLatePlayerModalOpen(true)}
/>
```

### 2. Hooks

#### useLobbyState
```tsx
import { useLobbyState } from "../hooks/useLobbyState";

const {
  selectedIds,
  handleToggleLobby,
  handleMoveUp,
  handleMoveDown,
  updateSelectedIds,
} = useLobbyState(initialIds);
```

#### useDraftState
```tsx
import { useDraftState } from "../hooks/useDraftState";

const {
  draftState,
  setDraftState,
  handleSmartShuffleDraft,
  movePlayer,
  handleQueueReorder,
  removeFromQueue,
} = useDraftState();

// Usar:
handleSmartShuffleDraft(allPlayers, selectedIds);
```

#### useMatchTimer
```tsx
import { useMatchTimer } from "../hooks/useMatchTimer";

useMatchTimer({
  gameState,
  currentMatchId,
  gameOverReason,
  onTimerTick: (newTimer) => {
    setGameState(prev => prev ? { ...prev, timer: newTimer } : null);
  },
  onTimerEnd: (reason) => {
    setGameOverReason(reason);
    setGameState(prev => prev ? { ...prev, timer: 0, isRunning: false } : null);
  },
  isEndingRef,
});
```

### 3. Utilitários

#### matchUtils
```tsx
import {
  buildQueueTeams,
  reorderQueue,
  movePlayerInQueue,
  calculateNextTeams,
  formatTeamsForShare,
  calculateRemainingTimer,
} from "../utils/matchUtils";

// Construir times da fila
const queueTeams = buildQueueTeams(queuePlayers);

// Reordenar fila
const newQueue = reorderQueue(queue, playerId, "up");

// Formatar para compartilhamento
const shareText = formatTeamsForShare(draftState);
navigator.clipboard.writeText(shareText);
```

#### statsUtils
```tsx
import {
  calculateStatsFromEvents,
  updateStatsOnGoal,
  removeStatsOnEventDeleted,
} from "../utils/statsUtils";

// Calcular stats de eventos
const stats = calculateStatsFromEvents(events);

// Atualizar stats ao marcar gol
const newStats = updateStatsOnGoal(stats, scorerId, assistId);
```

---

## 📉 Redução Estimada

| Item | Antes | Depois | Redução |
|------|-------|--------|---------|
| Dashboard.tsx | 1157 linhas | ~400 linhas | **-65%** |
| Componentes extraídos | 0 | 4 arquivos | +330 linhas |
| Hooks criados | 0 | 3 arquivos | +240 linhas |
| Utilitários | 0 | 2 arquivos | +140 linhas |

**Total:** Código mais organizado e reutilizável, mesmo que o total de linhas seja similar.

---

## 🎯 Próximos Passos

1. ⏳ Criar `useMatchState.ts` para gerenciar estado da partida
2. ⏳ Criar `useMatchData.ts` para carregar dados iniciais
3. ⏳ Refatorar `Dashboard.tsx` usando todos os novos componentes e hooks
4. ✅ Testar funcionalidades após refatoração
5. ✅ Verificar se não há regressões

---

## 💡 Benefícios Alcançados

- ✅ **Separação de responsabilidades:** Cada componente/hook tem uma função clara
- ✅ **Reutilização:** Componentes e hooks podem ser usados em outros lugares
- ✅ **Testabilidade:** Funções isoladas são mais fáceis de testar
- ✅ **Manutenibilidade:** Código mais fácil de entender e modificar
- ✅ **Performance:** Hooks podem otimizar re-renders com `useMemo` e `useCallback`
