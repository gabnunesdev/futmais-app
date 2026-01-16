import type { Player, Team } from "../../types";

export const PLAYERS_PER_TEAM = 6; // Ajuste conforme seu jogo (5, 6, 7...)

export const generateTeams = (
  checkedInPlayers: Player[]
): { red: Team; blue: Team; queue: Team[] } => {
  // 1. Validação
  if (checkedInPlayers.length < PLAYERS_PER_TEAM * 2) {
    throw new Error(
      `Precisamos de no mínimo ${PLAYERS_PER_TEAM * 2} jogadores para começar.`
    );
  }

  // 2. Separar quem joga AGORA (os primeiros que chegaram)
  const totalFirstGame = PLAYERS_PER_TEAM * 2;

  // Como a lista já vem ordenada por check-in (input do usuário), pegamos os primeiros
  const poolForFirstGame = checkedInPlayers.slice(0, totalFirstGame);

  // O resto vai para a fila
  const poolForQueue = checkedInPlayers.slice(totalFirstGame);

  // 3. Equilibrar o Primeiro Jogo (Snake Draft por Estrelas)
  // Ordena apenas o grupo inicial por força para dividir justo
  const sortedPool = [...poolForFirstGame].sort((a, b) => b.stars - a.stars);

  const redPlayers: Player[] = [];
  const bluePlayers: Player[] = [];

  // 4. Algoritmo de Distribuição Balanceada (Snake Draft)
  sortedPool.forEach((player, index) => {
    // Calcula o turno do draft (1-2-2-1...)
    const turn = Math.floor(index / 2);

    // Lógica explícita em vez de ternária
    if (turn % 2 === 0) {
      // Turnos pares (0, 2, 4...): Ordem normal
      if (index % 2 === 0) {
        redPlayers.push(player);
      } else {
        bluePlayers.push(player);
      }
    } else {
      // Turnos ímpares (1, 3, 5...): Ordem invertida para equilibrar
      if (index % 2 === 0) {
        bluePlayers.push(player);
      } else {
        redPlayers.push(player);
      }
    }
  });

  // 4. Montar a Fila (Time 3, Time 4...)
  // A fila mantém a ordem de chegada ou equilibra internamente?
  // Geralmente quem tá fora quer jogar logo. Vamos montar times fechados na ordem.
  const queueTeams: Team[] = [];

  for (let i = 0; i < poolForQueue.length; i += PLAYERS_PER_TEAM) {
    const chunk = poolForQueue.slice(i, i + PLAYERS_PER_TEAM);
    // Se sobrar gente (ex: 2 pessoas), eles ficam num time incompleto esperando completar
    queueTeams.push({
      name: `Time ${3 + queueTeams.length}`,
      players: chunk,
    });
  }

  return {
    red: { name: "Time Vermelho", players: redPlayers },
    blue: { name: "Time Azul", players: bluePlayers },
    queue: queueTeams,
  };
};
