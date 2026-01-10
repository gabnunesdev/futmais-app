Este é o momento de vender o seu peixe! Um bom README não diz apenas "como rodar o projeto", ele conta a **história de como você resolveu problemas complexos**.

Para um recrutador, o que brilha os olhos é ver **Decisões Técnicas** e **Produto**.

Abaixo está um template profissional, escrito em Markdown. Você só precisa tirar os prints do app e colocar os links das imagens.

---

### 📄 Template do `README.md` (Copie e cole na raiz do seu projeto)

```markdown
# ⚽ Gerenciador de Racha (Soccer Squad Manager)

![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8)
![Status](https://img.shields.io/badge/Status-Production_Ready-success)

> Um sistema completo para gestão de partidas de futebol amador, focado em equilíbrio de times, cronometragem precisa e estatísticas detalhadas.

---

## 📸 Demonstração

![Dashboard Principal](./screenshots/dashboard.png)
*Painel de controle em tempo real com cronômetro, placar e eventos.*

| Ranking e Estatísticas | Histórico de Partidas |
|:-------------------------:|:-------------------------:|
| ![Ranking](./screenshots/ranking.png) | ![Histórico](./screenshots/history.png) |

---

## 🎯 O Problema
Organizar um futebol semanal ("Racha") é caótico:
1.  **Desequilíbrio:** Times montados na hora geralmente ficam injustos.
2.  **Perda de Dados:** Placar e tempo são esquecidos ou perdidos se o celular bloquear.
3.  **Gestão de Fila:** Quem é o próximo? Quem chegou atrasado entra onde?
4.  **Falta de Métricas:** Quem é o artilheiro do ano? Quem mais venceu?

## 💡 A Solução
Desenvolvi uma **SPA (Single Page Application)** robusta que atua como um "Juiz Digital e Gestor de Estatísticas". O sistema gerencia desde o sorteio dos times (baseado em algoritmo de peso por habilidade) até o relatório pós-jogo.

### ✨ Funcionalidades Chave
* **⚖️ Algoritmo de Balanceamento:** Sorteia times equilibrados baseados em notas (1-5 estrelas) dos jogadores.
* **⏱️ Cronômetro Persistente:** Sistema inteligente que recupera o tempo exato de jogo mesmo se o navegador for fechado ou a página recarregada (Crash Recovery).
* **🔄 Gestão de Fila e Reciclagem:** Lógica automática para formar o próximo time, mesclando quem estava na fila com os vencedores/perdedores da partida anterior.
* **📊 Analytics:** Ranking automático (Gols/Assistências) com filtros por Período (Dia, Mês, Ano, Geral).
* **📱 Mobile-First & UX:** Interface pensada para uso em campo, com botões grandes, compartilhamento de times via WhatsApp e Modo Escuro/Claro (automático).

---

## 🛠️ Decisões Técnicas e Desafios (Technical Decisions)

### 1. Gestão de Estado e Performance (React + Refs)
Um dos maiores desafios foi o cronômetro. Usar apenas `useState` causava re-renderizações excessivas e dependências cíclicas no `useEffect`.
**Solução:** Implementei o padrão `useRef` para manter o estado do jogo acessível dentro dos intervalos de tempo sem disparar re-renders desnecessários, garantindo performance lisa em dispositivos móveis.

### 2. Persistência e "Crash Recovery"
O ambiente de uso (campo de futebol) é instável. O usuário pode fechar a aba sem querer.
**Solução:** Implementei uma sincronização híbrida com o **Supabase**. Ao iniciar ou pausar, o sistema salva o `timestamp` (`last_active_at`). Ao recarregar a página, o front-end calcula a diferença de tempo (`Date.now() - last_active_at`) e subtrai do timer, restaurando o estado exato do jogo como se nada tivesse acontecido.

### 3. Banco de Dados e Integridade (SQL)
Para garantir que o Ranking e o Histórico fossem precisos, evitei fazer cálculos pesados no Front-end.
**Solução:**
* Criação de **SQL Views** no PostgreSQL para agregar dados históricos.
* Uso de transações atômicas para finalizar partidas, garantindo que o status da partida, o vencedor e o timer sejam salvos simultaneamente.

### 4. Clean Architecture (Services)
Separei a lógica de negócios da interface.
* `services/matchService.ts`: Lida com regras de negócio da partida.
* `services/statsService.ts`: Processa dados analíticos.
* `domain/balancer.ts`: Contém a lógica pura do algoritmo de sorteio de times.

---

## 🚀 Tecnologias Utilizadas

* **Front-end:** React, TypeScript, Vite.
* **Estilização:** Tailwind CSS (para desenvolvimento rápido e responsivo).
* **Ícones:** Lucide React.
* **Back-end (BaaS):** Supabase (PostgreSQL, Realtime).
* **Deploy:** Vercel (CI/CD automático via GitHub).

---

## 📦 Como rodar localmente

1. Clone o repositório:
```bash
git clone [https://github.com/SEU-USUARIO/NOME-DO-REPO.git](https://github.com/SEU-USUARIO/NOME-DO-REPO.git)

```

2. Instale as dependências:

```bash
npm install

```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz e adicione suas chaves do Supabase:

```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui

```

4. Rode o projeto:

```bash
npm run dev

```

---

## 🔮 Próximos Passos (Roadmap)

* [ ] Implementar sistema de Autenticação (Login) para múltiplos administradores.
* [ ] Criar perfil público do jogador (para cada um ver suas próprias estatísticas).
* [ ] Adicionar gráficos de evolução de performance (Chart.js).

---

Desenvolvido com ⚽ e 💻 por **Gabriel Nunes**.
[https://www.linkedin.com/in/gabrielnunes-dev/] 

```