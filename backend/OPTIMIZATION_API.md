# API de Otimização de Tarefas

Este documento descreve como usar os endpoints de otimização para distribuir tarefas entre equipes de forma otimizada.

## Fluxo de Otimização

### 1. Criar Tarefas
Primeiro, crie as tarefas que precisam ser executadas:

```bash
POST /api/v1/tasks/
{
    "status": "pending",
    "category": 1
}
```

### 2. Obter Dados para Otimização
Use o endpoint para obter todas as informações necessárias para o serviço externo de otimização:

```bash
GET /api/v1/tasks/optimization-data/
```

**Resposta:**
```json
{
    "available_teams": [
        {
            "id": 1,
            "name": "Equipe A",
            "shift": "manhã",
            "is_ocupied": false
        }
    ],
    "pending_tasks": [
        {
            "id": 1,
            "status": "pending",
            "category": "Manutenção",
            "estimated_time": 60
        }
    ],
    "available_equipment": [
        {
            "id": 1,
            "name": "Ferramenta X",
            "type": "manual",
            "is_available": true
        }
    ],
    "total_estimated_time": 60
}
```

### 3. Enviar para Serviço Externo
Envie esses dados para seu serviço externo de otimização (algoritmo genético, solver, etc.).

### 4. Receber Recomendações e Aplicar
Quando o serviço externo retornar as recomendações, use o endpoint para aplicá-las:

```bash
POST /api/v1/tasks/apply-optimization/
{
    "optimization_results": [
        {
            "task_id": 1,
            "team_id": 1,
            "begin_time": "2024-01-15T08:00:00Z",
            "end_time": "2024-01-15T09:00:00Z"
        }
    ]
}
```

**Resposta:**
```json
{
    "created_assignments": [
        {
            "id": 1,
            "task_id": 1,
            "team_id": 1,
            "begin_time": "2024-01-15T08:00:00Z",
            "end_time": "2024-01-15T09:00:00Z",
            "action": "created"
        }
    ],
    "errors": [],
    "total_processed": 1,
    "successful": 1,
    "failed": 0
}
```

## Estrutura dos Dados

### TeamTask
O modelo `TeamTask` agora inclui:
- `task`: Referência à tarefa
- `team`: Referência à equipe
- `begin`: Horário de início da execução
- `end`: Horário de fim da execução

### Endpoints Disponíveis

#### Tasks
- `GET /api/v1/tasks/` - Listar todas as tarefas
- `POST /api/v1/tasks/` - Criar nova tarefa
- `GET /api/v1/tasks/optimization-data/` - Obter dados para otimização
- `POST /api/v1/tasks/apply-optimization/` - Aplicar resultados da otimização

#### TeamTask
- `GET /api/v1/team-tasks/` - Listar todas as associações
- `POST /api/v1/team-tasks/` - Criar nova associação
- `PUT /api/v1/team-tasks/{id}/` - Atualizar associação
- `DELETE /api/v1/team-tasks/{id}/` - Remover associação

## Exemplo de Uso Completo

```python
import requests

# 1. Criar tarefa
task_data = {"status": "pending", "category": 1}
task_response = requests.post("http://localhost:8000/api/v1/tasks/", json=task_data)
task_id = task_response.json()["id"]

# 2. Obter dados para otimização
optimization_data = requests.get("http://localhost:8000/api/v1/tasks/optimization-data/").json()

# 3. Enviar para serviço externo (exemplo)
# external_service_result = send_to_optimization_service(optimization_data)

# 4. Aplicar resultados (exemplo)
optimization_results = [
    {
        "task_id": task_id,
        "team_id": 1,
        "begin_time": "2024-01-15T08:00:00Z",
        "end_time": "2024-01-15T09:00:00Z"
    }
]

apply_response = requests.post(
    "http://localhost:8000/api/v1/tasks/apply-optimization/",
    json={"optimization_results": optimization_results}
)
```

## Benefícios

1. **Flexibilidade**: Tarefas podem ser criadas sem associação imediata a equipes
2. **Otimização**: Permite uso de algoritmos externos para distribuição eficiente
3. **Rastreabilidade**: Mantém histórico de quando cada equipe deve executar cada tarefa
4. **Escalabilidade**: Suporta múltiplas equipes e tarefas simultaneamente
