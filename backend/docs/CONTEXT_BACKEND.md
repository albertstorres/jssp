## Contexto do Frontend para Ajustes no Backend

Este documento descreve como o frontend consome o backend: autenticação, rotas, endpoints, contratos esperados e fluxos críticos (especialmente alocação e visualização no Gantt). Use-o como guia para garantir que os endpoints, filtros e payloads do backend estejam alinhados.

### Autenticação
- **Token**: armazenado em `localStorage` com a chave `access` e enviado como `Authorization: Bearer <token>` em todas as chamadas.
- **Endpoint do usuário atual** (opcional, mas usado): `GET /api/v1/users/me/` → retorna `{ id, username, first_name, is_superuser }`.
- **Base URL**: `http://localhost:8000` (ajustável). Timeout de 10s.

### Rotas principais (guardadas por token e grupos)
- Login: `/` → página de `SignIn`.
- Protegidas (requer token):
  - `/main` (grupos: `administrators`, `operators`) → Gantt com operações em aberto.
  - `/mainWorker` (grupo: `workers`).
  - Menus e CRUD: `/menuCategories`, `/menuEquipments`, `/menuOperations`, `/menuTasks`, `/menuTeams`, `/menuWorkers`, e páginas de criação/listagem relacionadas.

### Visualização Gantt (requisitos de dados)
A tela `Main` renderiza `GanttChart` a partir do hook `useOperations`. O gráfico exibe múltiplas tarefas por equipe no eixo Y ao longo do tempo no eixo X.

- Estrutura esperada no frontend para cada barra do Gantt (após montagem dos dados):
```ts
type GanttTask = {
  operation: string;   // Nome da operação dona da tarefa
  task: string;        // Ex.: "Tarefa #<id>"
  equipments: string[];// Nomes dos equipamentos envolvidos na operação
  team: string;        // Nome da equipe alocada (eixo Y)
  begin: string;       // ISO datetime
  end: string;         // ISO datetime (deve ser > begin)
  category: string;    // Nome da categoria da tarefa
};
```

#### Fonte dos dados no frontend (pipeline atual)
1) `GET /api/v1/operations/?finalized=False`
   - Resposta esperada (por item):
   ```json
   {
     "id": 1,
     "name": "Operação A",
     "begin": "2025-09-16T08:00:00Z",
     "end": "2025-09-16T12:00:00Z",
     "finalized": false,
     "tasks": [10, 11, 12],
     "equipments": [{"id": 3, "name": "Caminhão 3"}]
   }
   ```

2) Para cada `taskId` retornado em operações abertas: `GET /api/v1/team_task/?task=<taskId>`
   - Esperado 0..n itens. Cada item representa a alocação da tarefa a uma equipe com janelas de tempo reais a serem plotadas.
   - Resposta por item:
   ```json
   {
     "id": 55,
     "team": 7,
     "task": 10,
     "begin": "2025-09-16T08:15:00Z",
     "end": "2025-09-16T09:45:00Z"
   }
   ```

3) Para cada equipe única: `GET /api/v1/teams/<teamId>/` → usado para obter `name` da equipe.
   - Resposta esperada:
   ```json
   { "id": 7, "name": "Equipe A", "shift": 1, "is_ocupied": false }
   ```

4) Mapear categorias: `GET /api/v1/categories/`
   - Resposta esperada (lista):
   ```json
   [ { "id": 2, "description": "Poda", "estimated_time": 90, "priority": "HIGH" } ]
   ```

5) Detalhe da tarefa (para achar a categoria): `GET /api/v1/tasks/<taskId>/`
   - Resposta esperada (campos mínimos usados):
   ```json
   {
     "id": 10,
     "status": "IN_PROGRESS",
     "created_at": "2025-09-16T08:00:00Z",
     "finished_at": null,
     "categorie": 2
   }
   ```

Com esses dados, o frontend monta barras por equipe usando os intervalos de `team_task.begin/end` (são a fonte da verdade do tempo). O nome da operação é inferido procurando qual operação contém a `task`.

### Requisitos e validações de dados no Gantt
- `begin` e `end` devem ser datas válidas e `begin < end`.
- Deve ser possível haver múltiplas tarefas para a mesma equipe (barras horizontais distintas na mesma categoria do eixo Y).
- Caso não haja `team_task` para uma tarefa, ela não é exibida no Gantt.
- `equipments` é exibido como lista de nomes (pode estar vazio, o frontend mostra "Sem equipamento").

### Montagem de Operações (criação de payload de jobs)
O componente `MountOperations` cria localmente um payload de jobs para otimização (clássica ou quântica) e atualiza flags de seleção no backend.

- Atualizações no backend ao montar um job:
  - PATCH em tarefas selecionadas: `PATCH /api/v1/tasks/<taskId>/ { "on_mount": true }`
  - PATCH em equipes selecionadas: `PATCH /api/v1/teams/<teamId>/ { "on_mount": true }`

- Estrutura do payload produzido no frontend:
```json
{
  "jobs": {
    "job_1": [
      [ [taskIds], [equipmentIds], [teamIds] ]
    ]
  }
}
```
- Onde `taskIds`, `equipmentIds`, `teamIds` são arrays de números. O frontend pode produzir tanto para `classic` quanto para `quantum` (a estrutura é a mesma, separados internamente por chave `jobs`).

### Endpoints usados pelo frontend (inventário mínimo)
- Autenticação/Usuário:
  - `GET /api/v1/users/me/`
- Operações e relacionamentos:
  - `GET /api/v1/operations/?finalized=False`
  - `GET /api/v1/team_task/?task=<taskId>`
  - `GET /api/v1/teams/<teamId>/`
  - `GET /api/v1/categories/`
  - `GET /api/v1/tasks/<taskId>/`
- Alterações de estado (flags de seleção):
  - `PATCH /api/v1/tasks/<taskId>/ { on_mount: true }`
  - `PATCH /api/v1/teams/<teamId>/ { on_mount: true }`
- Exemplos adicionais (CRUD existentes em telas de criação):
  - `POST /api/v1/tasks/` (criação de tarefas)
  - `POST /api/v1/teams/` (criação de equipes)
  - `POST /api/v1/operations/` (em `SetOperation`, pode variar conforme payload)

### Considerações de modelo no backend
- `Operation` deve conter:
  - `id`, `name`, `begin`, `end`, `finalized: boolean`, `tasks: number[]`, `equipments: { id, name }[]`.
- `Task` deve conter (mínimo usado): `id`, `status`, `created_at`, `finished_at`, `categorie: number`, e permitir `PATCH on_mount`.
- `TeamTask` representa alocação de `Task` em `Team` com janelas de tempo reais: `team`, `task`, `begin`, `end`.
- `Team` deve expor `id`, `name`, `shift`, `is_ocupied` e permitir `PATCH on_mount`.
- `Category` deve expor `id`, `description`, `estimated_time`, `priority`.

### Regras de negócio destacadas
- O gráfico deve suportar múltiplas tarefas por equipe simultaneamente ao longo do tempo (eixo Y = equipes, X = tempo), refletindo alocações reais de `team_task`. Isso é central para a visualização e planejamento.

### Códigos de resposta e erros
- O frontend assume respostas 200 para `GET`, 2xx para `PATCH/POST`. Mensagens de erro ou ausência de dados são apenas logadas no console e a UI exibe mensagens genéricas (ex.: "Carregando operações..."). Considere padronizar respostas e erros no backend.

### Segurança e CORS
- Todas as requisições usam `Authorization: Bearer <token>`. Habilitar CORS para `http://localhost:*` em desenvolvimento ou conforme ambiente.

### Observações finais
- Se possível, disponibilizar endpoints para recuperar `team_task` em lote por múltiplas `task` (ex.: `GET /api/v1/team_task/?task__in=1,2,3`) para reduzir N chamadas.
- Garantir que filtros como `?finalized=False` sejam case-insensitive e aceitem boolean de forma canônica.


