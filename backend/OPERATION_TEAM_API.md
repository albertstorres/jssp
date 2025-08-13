# API OperationTeam

Este documento descreve a estrutura e uso da app `operation_team` que gerencia a associação entre operações e equipes com horários de execução.

## Estrutura do Modelo

### OperationTeam
O modelo `OperationTeam` representa a associação entre uma operação e uma equipe com horários específicos:

- `operation`: Referência à operação (ForeignKey para Operation)
- `team`: Referência à equipe (ForeignKey para Team)
- `begin`: Horário de início da execução (DateTimeField)
- `end`: Horário de fim da execução (DateTimeField)

## Endpoints Disponíveis

### OperationTeam
- `GET /api/v1/operation-teams/` - Listar todas as associações
- `POST /api/v1/operation-teams/` - Criar nova associação
- `GET /api/v1/operation-teams/{id}/` - Obter associação específica
- `PUT /api/v1/operation-teams/{id}/` - Atualizar associação
- `DELETE /api/v1/operation-teams/{id}/` - Remover associação

### Operations (com endpoint de otimização)
- `POST /api/v1/operations/{id}/apply-optimization/` - Aplicar resultados da otimização

#### Tasks
- `GET /api/v1/tasks/` - Listar todas as tarefas
- `POST /api/v1/tasks/` - Criar nova tarefa
- `PATCH /api/v1/tasks/{id}/start/` - Iniciar tarefa (status → 'in_progress')
- `PATCH /api/v1/tasks/{id}/finish/` - Finalizar tarefa (status → 'finished') e verificar liberação de equipe
- `PUT /api/v1/tasks/{id}/` - Atualizar tarefa
- `DELETE /api/v1/tasks/{id}/` - Remover tarefa

#### TeamTask
- `GET /api/v1/team-tasks/` - Listar todas as associações
- `POST /api/v1/team-tasks/` - Criar nova associação
- `PUT /api/v1/team-tasks/{id}/` - Atualizar associação
- `DELETE /api/v1/team-tasks/{id}/` - Remover associação

## Fluxo de Uso

### 1. Criar Operação
Primeiro, crie uma operação com suas tarefas, equipamentos e equipes:

```bash
POST /api/v1/operations/
{
    "name": "Manutenção Preventiva",
    "task_ids": [1, 2, 3],
    "equipment_ids": [5, 6],
    "team_ids": [1, 2],
    "optimization_type": "classic"
}
```

**O que acontece automaticamente:**
1. ✅ A operação é criada com horários otimizados
2. ✅ As tarefas são associadas à operação
3. ✅ Os equipamentos são associados à operação
4. ✅ **Os registros OperationTeam são criados automaticamente** com horários otimizados para cada equipe

### 2. Resultado da Otimização
A otimização clássica retorna dados estruturados que incluem:

```json
{
    "name": "Manutenção Preventiva",
    "begin": "2024-01-15T08:00:00Z",
    "end": "2024-01-15T12:00:00Z",
    "timespan": 14400,
    "task_ids": [1, 2, 3],
    "equipment_ids": [5, 6],
    "team_assignments": [
        {
            "team_name": "Equipe A",
            "begin_time": "2024-01-15T08:00:00Z",
            "end_time": "2024-01-15T10:00:00Z"
        },
        {
            "team_name": "Equipe B",
            "begin_time": "2024-01-15T10:00:00Z",
            "end_time": "2024-01-15T12:00:00Z"
        }
    ]
}
```

## Exemplo de Uso Completo

```python
import requests

# 1. Criar operação
operation_data = {
    "name": "Manutenção Preventiva",
    "task_ids": [1, 2, 3],
    "equipment_ids": [5, 6],
    "team_ids": [1, 2],
    "optimization_type": "classic"
}

operation_response = requests.post(
    "http://localhost:8000/api/v1/operations/", 
    json=operation_data
)
operation_id = operation_response.json()["id"]

# 2. Aplicar resultados da otimização
team_assignments = [
    {
        "team_id": 1,
        "begin_time": "2024-01-15T08:00:00Z",
        "end_time": "2024-01-15T10:00:00Z"
    },
    {
        "team_id": 2,
        "begin_time": "2024-01-15T10:00:00Z",
        "end_time": "2024-01-15T12:00:00Z"
    }
]

apply_response = requests.post(
    f"http://localhost:8000/api/v1/operations/{operation_id}/apply-optimization/",
    json={"team_assignments": team_assignments}
)

print(apply_response.json())
```

## Relacionamentos

### Operation → OperationTeam → Team
- Uma operação pode ter múltiplas equipes associadas
- Cada equipe tem horários específicos de execução
- **As equipes são marcadas como ocupadas automaticamente ao serem associadas**
- **As equipes são liberadas quando TODAS as suas tarefas associadas são finalizadas**
- **O status das equipes NÃO é alterado quando a operação é finalizada**

### Operation → OperationTask → Task
- Uma operação contém múltiplas tarefas
- As tarefas são gerenciadas independentemente das equipes
- **O status de uma tarefa afeta diretamente a disponibilidade da equipe que a executa**
- **A operação é automaticamente finalizada quando TODAS as suas tarefas são finalizadas**

### Operation → EquipmentOperation → Equipment
- Uma operação pode usar múltiplos equipamentos
- Os equipamentos são reservados para a operação

## Benefícios

1. **Flexibilidade**: Permite múltiplas equipes trabalhando na mesma operação
2. **Otimização**: Integra com o serviço de otimização existente
3. **Rastreabilidade**: Mantém histórico de quando cada equipe executa cada operação
4. **Escalabilidade**: Suporta operações complexas com múltiplas equipes
5. **Sincronização**: Coordena horários entre equipes e operações

## Fluxo de Finalização Automática

### **Regra de Negócio:**
1. **Equipe é liberada** quando todas as suas tarefas associadas são finalizadas
2. **Operação é finalizada** quando todas as suas tarefas são finalizadas
3. **Status das equipes NÃO é alterado** quando a operação é finalizada

### **Exemplo de Fluxo:**

**Cenário:** Operação com 4 tarefas
- Equipe A: Tarefas 1 e 2
- Equipe B: Tarefas 3 e 4

**Sequência de Finalização:**
1. ✅ **Tarefa 1 finalizada** → Equipe A ainda ocupada (tarefa 2 em andamento)
2. ✅ **Tarefa 2 finalizada** → Equipe A liberada (todas as suas tarefas finalizadas)
3. ✅ **Tarefa 3 finalizada** → Equipe B ainda ocupada (tarefa 4 em andamento)
4. ✅ **Tarefa 4 finalizada** → Equipe B liberada (todas as suas tarefas finalizadas)
5. ✅ **Operação finalizada automaticamente** → Todas as tarefas finalizadas
6. ⚠️ **Status das equipes mantido** → Equipes já foram liberadas anteriormente por suas tarefas

### **Endpoints que Disparam a Finalização:**
- `PATCH /api/v1/tasks/{id}/finish/` - Finaliza tarefa e verifica operação
- `PUT /api/v1/tasks/{id}/` - Atualiza tarefa e verifica operação
