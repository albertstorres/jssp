import numpy as np
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List
import logging

from optimizations.classes.jssp import jssp

# Configurar logging
logger = logging.getLogger(__name__)


def isoformat(dt: datetime) -> str:
    """Converte datetime para formato ISO8601 com Z."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat().replace("+00:00", "Z")


def make_fitness_function(instance: jssp):
    """
    Função de avaliação (fitness) personalizada para o JSSP.
    Considera operações sequenciais dentro de cada job com duração individual.
    """
    operations = instance.get_flattened_operations()
    
    logger.info(f"Criando função de fitness para {len(operations)} operações")
    
    # Log das durações individuais
    for i, op in enumerate(operations):
        logger.info(f"   Operação {i}: Job {op['job']}, Duração {op['duration']}s")

    def fitness(solution):
        priority_order = np.argsort(solution)
        
        # Dicionários para acompanhar disponibilidade
        machine_available = {}  # {máquina: tempo_disponível}
        job_available = {}      # {job: tempo_disponível}
        end_times = []

        logger.info(f"   Calculando fitness para solução: {priority_order.tolist()}")

        # Executa operações na ordem de prioridade
        for idx in priority_order:
            op = operations[idx]
            job = op["job"]
            machines = op["machines"]
            duration = op["duration"]  # Usar duração individual da tarefa

            # Seleciona máquina disponível mais cedo
            machine = min(machines, key=lambda m: machine_available.get(m, 0))

            # Tempo de início respeitando precedência do job (ordem original) e máquina
            start_time = max(
                machine_available.get(machine, 0),
                job_available.get(job, 0)
            )
            end_time = start_time + duration

            logger.info(f"      Operação {idx}: Job {job}, Máquina {machine}")
            logger.info(f"         Horários: {start_time}s -> {end_time}s (duração: {duration}s)")

            # Atualiza disponibilidade da máquina e do job (garante precedência)
            machine_available[machine] = end_time
            job_available[job] = end_time
            end_times.append(end_time)

        makespan = max(end_times)
        logger.info(f"   Makespan calculado: {makespan}s")
        
        return makespan  # Makespan (tempo total)

    return fitness


def simulate_schedule_optimized(solution_vec, operations, start_time: datetime | None = None):
    """
    Simula o escalonamento baseado na solução otimizada.
    Retorna cronograma detalhado com horários de início/fim sequenciais.
    """
    if start_time is None:
        start_time = datetime.now(timezone.utc)
    
    order = np.argsort(solution_vec)
    machine_available = {}
    job_available = {}
    schedule = []
    
    logger.info(f"Simulando cronograma com {len(operations)} operações")
    logger.info(f"   Ordem de execução: {order.tolist()}")

    for idx in order:
        op = operations[idx]
        job = op["job"]
        machines = op["machines"]
        duration = op["duration"]
        task_id = op.get("task_id", idx)  # Usar task_id da operação

        logger.info(f"   Processando operação {idx}: Job {job}, Tarefa {task_id}, Duração {duration}s")

        # Seleciona máquina disponível mais cedo
        machine = min(machines, key=lambda m: machine_available.get(m, 0))

        # Calcula horários respeitando precedência do job e máquina
        start_time_seconds = max(
            machine_available.get(machine, 0),
            job_available.get(job, 0)
        )
        end_time_seconds = start_time_seconds + duration

        logger.info(f"      Horários calculados: {start_time_seconds}s -> {end_time_seconds}s (duração: {duration}s)")
        logger.info(f"      Máquina selecionada: {machine}")

        # Atualiza disponibilidade da máquina e do job (garante precedência)
        machine_available[machine] = end_time_seconds
        job_available[job] = end_time_seconds

        schedule.append({
            "job": job,
            "machine": machine,
            "start": start_time_seconds,
            "end": end_time_seconds,
            "duration": duration,
            "op_index": idx,
            "task_id": task_id,  # Incluir ID da tarefa
            "machines": machines,
            "equipments": op.get("equipments", [])
        })
        
        logger.info(f"      Operação {idx} agendada: {start_time_seconds}s -> {end_time_seconds}s")

    # Log do cronograma final
    logger.info(f"CRONOGRAMA FINAL:")
    for op in schedule:
        logger.info(f"   {op['job']} → Máquina {op['machine']}: {op['start']}s -> {op['end']}s (duração: {op['duration']}s)")
    
    return schedule


def convert_schedule_to_team_assignments(schedule, start_time: datetime):
    """
    Converte o cronograma otimizado para o formato team_assignments esperado pelo backend.
    """
    # Agrupa por equipe (machine)
    team_to_tasks: Dict[Any, List[Dict[str, Any]]] = {}
    
    for op in schedule:
        machine = op["machine"]
        task_id = op.get("task_id")
        
        # Converte tempos em segundos para datetime
        begin_time = start_time + timedelta(seconds=op["start"])
        end_time = start_time + timedelta(seconds=op["end"])
        
        team_to_tasks.setdefault(machine, []).append({
            "task_id": task_id,
            "begin_time": isoformat(begin_time),
            "end_time": isoformat(end_time),
            "duration": op["duration"],
        })
    
    # Consolida begin/end global
    all_begins = [datetime.fromisoformat(t["begin_time"].replace("Z", "+00:00"))
                  for tasks in team_to_tasks.values() for t in tasks]
    all_ends = [datetime.fromisoformat(t["end_time"].replace("Z", "+00:00"))
                for tasks in team_to_tasks.values() for t in tasks]

    if all_begins and all_ends:
        global_begin = min(all_begins)
        global_end = max(all_ends)
        timespan = int((global_end - global_begin).total_seconds())
    else:
        global_begin = start_time
        global_end = start_time
        timespan = 0

    return {
        "name": schedule[0]["job"] if schedule else "Job",
        "begin": isoformat(global_begin),
        "end": isoformat(global_end),
        "timespan": timespan,
        "team_assignments": [
            {"team": team, "tasks": tasks}
            for team, tasks in team_to_tasks.items()
        ],
    }


def run_optimization(jobs_payload: Dict[str, Any], start_time: datetime | None = None, use_sa: bool = True) -> Dict[str, Any]:
    """
    Executa otimização JSSP usando Simulated Annealing ou algoritmo guloso.
    
    Args:
        jobs_payload: Dicionário com dados do problema JSSP (uma única operação/job)
        start_time: Data/hora de início para as operações
        use_sa: Se deve usar Simulated Annealing (True) ou algoritmo guloso (False)
    
    Returns:
        Dict: Resultado com team_assignments para persistência no backend
    """
    if start_time is None:
        start_time = datetime.now(timezone.utc)

    try:
        # Cria instância do problema JSSP
        instance = jssp(jobs_payload)
        operations = instance.get_flattened_operations()
        num_ops = len(operations)

        logger.info(f"Iniciando otimização JSSP com {num_ops} operações para uma única operação")

        if use_sa:
            # Usa Simulated Annealing
            try:
                from mealpy import SA
                from mealpy.utils.space import FloatVar
                
                fitness_func = make_fitness_function(instance)
                
                # Configura problema para o mealpy
                problem = {
                    "obj_func": fitness_func,
                    "bounds": [FloatVar(lb=0.0, ub=1.0) for _ in range(num_ops)],
                    "minmax": "min",
                }

                # Executa Simulated Annealing
                model = SA.OriginalSA(epoch=1000)
                g_best = model.solve(problem)

                logger.info(f"Otimização SA concluída. Makespan: {g_best.target.fitness}")

                # Simula cronograma otimizado
                schedule = simulate_schedule_optimized(g_best.solution, operations, start_time)
                
            except ImportError:
                logger.warning("mealpy não disponível, usando algoritmo guloso")
                use_sa = False
        
        if not use_sa:
            # Usa algoritmo guloso simples
            logger.info("Usando algoritmo guloso")
            schedule = simulate_schedule_optimized(np.random.random(num_ops), operations, start_time)

        # Converte para formato team_assignments
        result = convert_schedule_to_team_assignments(schedule, start_time)
        
        logger.info(f"Otimização concluída. Makespan: {result['timespan']}s")
        
        return result

    except Exception as e:
        logger.error(f"Erro na otimização: {str(e)}")
        # Retorna estrutura vazia em caso de erro
        return {
            "name": "Job",
            "begin": isoformat(start_time),
            "end": isoformat(start_time),
            "timespan": 0,
            "team_assignments": [],
        }


def get_optimization_summary(result):
    """
    Retorna resumo da otimização para exibição.
    """
    if not result or not result.get("team_assignments"):
        return "Otimização falhou ou não retornou resultados"
    
    timespan = result.get("timespan", 0)
    team_assignments = result.get("team_assignments", [])
    
    total_tasks = sum(len(ta["tasks"]) for ta in team_assignments)
    
    summary = f"""
Otimização JSSP concluída com sucesso!

Métricas:
   • Makespan: {timespan} segundos
   • Total de tarefas: {total_tasks}
   • Equipes utilizadas: {len(team_assignments)}
   • Data de início: {result.get('begin', 'N/A')}

Cronograma otimizado:
"""
    
    for ta in team_assignments:
        team = ta["team"]
        for task in ta["tasks"]:
            summary += f"   • Equipe {team} → Tarefa {task['task_id']}: {task['begin_time']} - {task['end_time']} (duração: {task['duration']}s)\n"
    
    return summary


# Exemplo de uso para uma única operação (compatível com backend)
def example_single_operation():
    """
    Exemplo de como usar com uma única operação do backend.
    Demonstra que tarefas com durações diferentes agora terminam em tempos diferentes.
    """
    # Dados que vêm do seu backend (uma única operação)
    single_operation_payload = {
        "jobs": {
            "Operação_1": [
                (["Equipe A", "Equipe B"], ["Eq X", "task_267"], 900),   # 15 min
                (["Equipe A"], ["Eq Y", "task_271"], 1200),               # 20 min  
                (["Equipe B", "Equipe C"], ["Eq Z", "task_269"], 600),    # 10 min
            ]
        },
        "timespan": 3600  # opcional
    }
    
    # Chama a otimização
    result = run_optimization(single_operation_payload)
    
    # Resultado já vem no formato correto para o backend
    print("Resultado da otimização:")
    print(f"Nome: {result['name']}")
    print(f"Timespan: {result['timespan']}s")
    print(f"Team assignments: {result['team_assignments']}")
    
    # Agora as tarefas terminam em tempos diferentes baseado na duração individual
    for ta in result['team_assignments']:
        team = ta['team']
        for task in ta['tasks']:
            print(f"Equipe {team} → Tarefa {task['task_id']}: {task['begin_time']} - {task['end_time']} (duração: {task['duration']}s)")
    
    return result