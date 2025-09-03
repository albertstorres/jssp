## Contexto do Backend (API JSSP)

Este documento descreve, de forma objetiva e operacional, como este backend funciona: modelos, endpoints, formatos de entrada/saída, fluxo da otimização (JSSP), regras de negócio e exemplos. Use-o como referência para outras janelas do Cursor IA entenderem o projeto rapidamente.

### Visão Geral
- **Stack**: Django 5 + Django REST Framework (DRF)
- **Domínio**: Escalonamento de tarefas (Job Shop Scheduling Problem) atribuindo tarefas a equipes com janela de tempo por tarefa
- **Apps principais**:
  - `operations`: CRUD de operações (jobs) e endpoints auxiliares (ex.: dados para Gantt)
  - `tasks`: CRUD de tarefas (status, timestamps)
  - `team_task`: Tabela de associação Equipe↔Tarefa com tempos de início/fim por tarefa
  - `teams`: CRUD de equipes e gestão de disponibilidade (`is_ocupied`)
  - `optimizations`: motor de otimização (Simulated Annealing) e classes de apoio (JSSP)

---

## Modelos

### `operations.Operation`
- Campos essenciais: `id`, `name`, `begin`, `end`, `timespan`, `finalized` (bool)
- Uso: representa uma execução de escalonamento (um "Job" lógico), que agrupa tarefas e seus agendamentos.

### `tasks.Task`
- Campos essenciais: `id`, `status` (pending, in_progress, finished), `created_at`, `finished_at`, `category`
- Regras: ao salvar e detectar `status=finished`, verifica associações em `TeamTask` e tenta liberar equipes relacionadas via `Team.release_if_possible()`.

### `team_task.TeamTask`
- Campos essenciais: `id`, `team` (FK), `task` (FK), `begin` (DateTime), `end` (DateTime)
- Restrições: `unique_together = ['team', 'task']`
- Regras: `begin` e `end` são obrigatórios; há validações e logs no `save()`.

### `teams.Team`
- Campos essenciais: `id`, `name`, `shift`, `is_ocupied` (bool)
- Regras de negócio:
  - `can_be_released()`: só pode ficar `is_ocupied=false` quando todas as tarefas associadas a ela estiverem finalizadas
  - `release_if_possible()` e `check_and_update_status()` implementam a lógica de liberação inteligente

---

## Serializers (principais)

### `operations/serializers.py`
- `OperationListSerializer`: inclui `team_tasks` agregando dados de `TeamTask` (team, task, operation, equipments, begin, end), pronto para o Gantt
- `OperationCreateSerializer`:
  - Valida `task_ids`, `team_ids`, `equipment_ids`
  - Prepara a estrutura de entrada para otimização (ver seção Fluxo de Otimização)
  - Executa `run_optimization(...)`
  - Cria a `Operation` e os registros `TeamTask` com os tempos sequenciais por tarefa, conforme retornados pela otimização

### `team_task/serializers.py`
- `TeamTaskSerializer`: retorna campos completos e auxiliares como `team_name` e `task_name` (fallback para "Tarefa #ID")

### `teams/serializers.py`
- `TeamSerializer`: expõe `id`, `name`, `is_ocupied` (campo crítico para o frontend)

---

## Filtros

### `team_task/filters.py`
- Implementado com `filters.BaseFilterBackend` manual
- Parâmetros aceitos via query string: `task` e `team` (ex.: `?task=123`, `?team=7`)

### `teams/filters.py`
- Baseado em `dj_rql` com `FILTERS = ['id','name','shift','is_ocupied']`
- Permite filtrar por `is_ocupied` (ex.: `?rql=eq(is_ocupied,true)`) ou os demais campos

---

## Views e Endpoints

Base path: `api/v1/`

### Operations
- `GET /operations/?finalized=False`
  - Retorna operações em aberto com campos: `id`, `name`, `finalized`, `tasks`, `equipments`
- `GET /operations/gantt_data/`
  - Retorna dados prontos para o Gantt baseados em `TeamTask`
- `POST /operations/` (criar)
  - Body esperado (exemplo mínimo):
```json
{
  "name": "Job 1",
  "task_ids": [1,2,3,4],
  "team_ids": [1,2],
  "equipment_ids": [10,11]
}
```
  - Efeito: roda a otimização, cria `Operation` e `TeamTask` com tempos por tarefa
- `POST /operations/{id}/finalize_operation/`
  - Marca operação como finalizada (não libera automaticamente equipes)

### Tasks
- `GET /tasks/{taskId}/`
  - Campos: `id`, `status`, `created_at`, `finished_at` (ou `null`), `category`

### TeamTask
- `GET /team_task/?task={taskId}`
  - Campos: `id`, `team`, `task`, `begin`, `end`, além de `team_name`, `task_name`

### Teams
- `GET /teams/{teamId}/`
  - Campos: `id`, `name`, `is_ocupied`
- `GET /teams/?rql=...`
  - Filtragem via RQL (inclui `is_ocupied`)
- `GET /teams/check_status/`
  - Verifica e atualiza status `is_ocupied` das equipes
- `POST /teams/{id}/release/`
  - Tenta liberar a equipe se todas as tarefas estiverem finalizadas

---

## Fluxo de Otimização (JSSP)

### Entrada enviada pelo serializer de criação de Operation
Estrutura montada em `OperationCreateSerializer`:
```python
jobs = {
  "jobs": {
    "<op_name>": [
      (
        ["Equipe A", "Equipe B"],          # machines (equipes candidatas)
        ["Eq X", "Eq Y", "task_<ID>"],    # equipments + marcador do task_id
        900                                   # duration (segundos) individual da tarefa
      ),
      ...
    ]
  }
}
```

Observação: o `task_id` é codificado como string no vetor de `equipments` (`"task_<ID>"`) apenas para transporte; ele é extraído corretamente dentro do módulo `optimizations`.

### Processamento interno (`optimizations/classes/jssp.py`)
- `jssp.process_data(...)` cria `Operation` internas com:
  - `machines`: lista de equipes disponíveis
  - `equipments`: lista de equipamentos reais (sem o marcador `task_...`)
  - `duration`: duração individual por tarefa
  - `task_id`: extraído do marcador `task_<ID>`
- `get_flattened_operations()` retorna uma lista de operações com `machines`, `equipments`, `duration`, `task_id` e `job`

### Simulação e Sequenciamento (`optimizations/classic_optimization.py`)
- O pipeline de otimização calcula a ordem e, em `simulate_schedule`, cria janelas de tempo sequenciais por tarefa, respeitando `duration` individual e preservando `task_id`
- Saída consolidada inclui, por equipe, um bloco `team_assignments` com `tasks`, onde cada `task` possui:
  - `task_id`
  - `begin_time` (ISO8601)
  - `end_time` (ISO8601)
  - `duration` (segundos)

### Saída esperada da otimização (esboço)
```json
[
  {
    "name": "Job 1",
    "begin": "2025-08-21T02:47:21.473Z",
    "end": "2025-08-21T03:59:21.473Z",
    "timespan": 4320,
    "team_assignments": [
      {
        "team": "Equipe A",
        "tasks": [
          { "task_id": 267, "begin_time": "...", "end_time": "...", "duration": 900 },
          { "task_id": 271, "begin_time": "...", "end_time": "...", "duration": 1200 }
        ]
      },
      {
        "team": "Equipe B",
        "tasks": [ ... ]
      }
    ]
  }
]
```

### Persistência pós-otimização
- O serializer consome `team_assignments` e cria um `TeamTask` por par `team`×`task`, usando os `begin_time`/`end_time` específicos por tarefa
- Não há criação duplicada por par `team`×`task` (há controle no serializer)

---

## Contratos de Dados para o Frontend (Gantt)

### Fontes de dados
- Operações em aberto: `GET /operations/?finalized=False`
- Para cada tarefa: `GET /tasks/{id}/`
- Para relações equipe-tarefa e tempos: `GET /team_task/?task={id}`
- Para nome da equipe: `GET /teams/{id}/`

### Regras
- Nunca usar `operation.begin/end` para as barras; usar `team_task.begin/end`
- `team.name` deve ser usado no eixo Y
- Considerar apenas operações `finalized=false`

### Exemplo de `TeamTask` (resumo)
```json
{
  "id": 1234,
  "team": 7,
  "team_name": "Equipe B",
  "task": 271,
  "task_name": "Tarefa #271",
  "begin": "2025-08-21T02:57:21.473Z",
  "end": "2025-08-21T03:12:21.473Z"
}
```

---

## Regras de Negócio de Equipes (`is_ocupied`)
- `is_ocupied=true` enquanto houver qualquer tarefa não finalizada associada
- Somente quando todas as tarefas associadas estiverem `finished`, a equipe pode ser liberada (`is_ocupied=false`)
- Endpoints auxiliares em `teams/views.py`:
  - `GET /teams/check_status/` atualiza o status de todas
  - `POST /teams/{id}/release/` tenta liberar uma equipe específica se possível

---

## Logging
- Loggers configurados para apps: `operations`, `team_task`, `tasks`, `teams`, `optimizations`
- Logs detalham: validações, entrada/saída da otimização, criação de `TeamTask`, tentativas de liberação de equipe

---

## Exemplos de Requisição/Resposta

### Criar operação
Request:
```http
POST /api/v1/operations/
Content-Type: application/json

{
  "name": "Job 1",
  "task_ids": [267, 271, 269, 272],
  "team_ids": [1, 2],
  "equipment_ids": [10]
}
```

Resposta (resumo):
```json
{
  "id": 42,
  "name": "Job 1",
  "finalized": false,
  "tasks": [267, 271, 269, 272],
  "equipments": [10]
}
```

### Consultar TeamTask por tarefa
```http
GET /api/v1/team_task/?task=271
```
Resposta (exemplo):
```json
[
  {
    "id": 555,
    "team": 2,
    "team_name": "Equipe B",
    "task": 271,
    "task_name": "Tarefa #271",
    "begin": "2025-08-21T02:57:21.473Z",
    "end": "2025-08-21T03:12:21.473Z"
  }
]
```

---

## Observações Operacionais
- Necessário garantir migrações aplicadas para `team_task` e demais apps
- Campo `is_ocupied` exposto no serializer de `Team`; filtrável via RQL
- Em caso de ausência de `estimated_time` na categoria da tarefa, há fallback (padrão) de duração configurado no serializer

---

## Arquivos-Chave
- `operations/serializers.py`: preparo de entrada, consumo da otimização e persistência
- `team_task/models.py`: integridade dos tempos por tarefa e logs
- `teams/models.py`: regras de liberação de equipes
- `optimizations/classic_optimization.py`: simulação e distribuição sequencial por tarefa (begin/end)
- `optimizations/classes/jssp.py` e `operation.py`: parsing e transporte de `task_id`/`duration`


