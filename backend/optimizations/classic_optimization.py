import numpy as np
from optimizations.classes.jssp import jssp
from mealpy import SA
from mealpy.utils.space import FloatVar
from django.utils import timezone
from datetime import timedelta
import logging

# Configurar logging para reduzir verbosidade
logging.getLogger('mealpy').setLevel(logging.WARNING)

# Configurar logger para esta aplicação
logger = logging.getLogger(__name__)


def make_fitness_function(instance: jssp):
    operations = instance.get_flattened_operations()

    def fitness(solution):
        priority_order = np.argsort(solution)
        machine_available = {}
        job_available = {}
        end_times = []

        for idx in priority_order:
            op = operations[idx]
            job = op["job"]
            machine = min(op["machines"], key=lambda m: machine_available.get(m, 0))
            duration = op["duration"]

            start_time = max(
                machine_available.get(machine, 0),
                job_available.get(job, 0)
            )
            end_time = start_time + duration

            machine_available[machine] = end_time
            job_available[job] = end_time
            end_times.append(end_time)

        return max(end_times),

    return fitness


def decode_solution(solution_vec, operations):
    order = np.argsort(solution_vec)
    machine_available = {}
    job_available = {}

    for i, idx in enumerate(order):
        op = operations[idx]
        job = op["job"]
        machine = min(op["machines"], key=lambda m: machine_available.get(m, 0))

        start_time = max(machine_available.get(machine, 0), job_available.get(job, 0))
        end_time = start_time + op["duration"]

        machine_available[machine] = end_time
        job_available[job] = end_time


def simulate_schedule(solution_vec, operations):
    order = np.argsort(solution_vec)
    machine_available = {}
    job_available = {}
    schedule = []

    for idx in order:
        op = operations[idx]
        job = op["job"]
        machine = min(op["machines"], key=lambda m: machine_available.get(m, 0))

        start_time = max(machine_available.get(machine, 0), job_available.get(job, 0))
        end_time = start_time + op["duration"]

        machine_available[machine] = end_time
        job_available[job] = end_time

        schedule.append({
            "job": job,
            "machine": machine,
            "start": start_time,
            "end": end_time,
            "duration": op["duration"],
            "op_index": idx
        })

    return schedule


def run_optimization(data: dict, start_datetime=None):
    if start_datetime is None:
        start_datetime = timezone.now()

    instance = jssp(data)
    operations = instance.get_flattened_operations()
    fitness_func = make_fitness_function(instance)
    num_ops = len(operations)

    problem = {
        "obj_func": fitness_func,
        "bounds": [FloatVar(lb=0.0, ub=1.0) for _ in range(num_ops)],
        "minmax": "min",
    }

    model = SA.OriginalSA(epoch=1000)
    g_best = model.solve(problem)

    decode_solution(g_best.solution, operations)

    schedule = simulate_schedule(g_best.solution, operations)

    results = []
    for job in instance.jobs:
        ops = [op for op in schedule if op["job"] == job.name]

        if not ops:
            continue

        start = min(op["start"] for op in ops)
        end = max(op["end"] for op in ops)

        # Criar resultado com informações de alocação de equipes
        result = {
            "name": job.name,
            "begin": (start_datetime + timedelta(seconds=start)).isoformat(),
            "end": (start_datetime + timedelta(seconds=end)).isoformat(),
            "timespan": end - start,
            "task_ids": job.tasks_ids,
            "equipment_ids": job.equipments_ids,
            "team_assignments": []  # Nova estrutura para alocação de equipes
        }
        
        # 🔧 CORREÇÃO CRÍTICA: Adicionar alocação de equipes com tarefas sequenciais
        if hasattr(job, 'usable_machines') and job.usable_machines:
            for i, team_name in enumerate(job.usable_machines):
                if team_name != "Unknown":
                    # Calcular horários para cada equipe
                    team_start = start_datetime + timedelta(seconds=start + (i * (end - start) / len(job.usable_machines)))
                    team_end = start_datetime + timedelta(seconds=start + ((i + 1) * (end - start) / len(job.usable_machines)))
                    
                    # 🔧 CORREÇÃO: Criar tarefas sequenciais para cada equipe
                    team_tasks = []
                    num_tasks = len(job.tasks_ids)
                    
                    if num_tasks > 0:
                        # 🔧 MELHORIA: Usar tempo estimado real da categoria de cada tarefa
                        total_estimated_time = 0
                        task_estimated_times = []
                        
                        # Calcular tempo total estimado baseado nas categorias das tarefas
                        for task_id in job.tasks_ids:
                            try:
                                from tasks.models import Task
                                task = Task.objects.get(id=task_id)
                                if task.category and hasattr(task.category, 'estimated_time'):
                                    estimated_time = task.category.estimated_time
                                    task_estimated_times.append(estimated_time)
                                    total_estimated_time += estimated_time
                                    logger.info(f"      ⏱️ Tarefa {task_id}: tempo estimado {estimated_time} minutos")
                                else:
                                    # Fallback: 30 minutos padrão
                                    task_estimated_times.append(30)
                                    total_estimated_time += 30
                                    logger.warning(f"      ⚠️ Tarefa {task_id}: sem tempo estimado, usando 30 min padrão")
                            except Exception as e:
                                logger.error(f"      ❌ Erro ao buscar tarefa {task_id}: {str(e)}")
                                # Fallback: 30 minutos padrão
                                task_estimated_times.append(30)
                                total_estimated_time += 30
                        
                        # Calcular proporção de tempo para cada tarefa
                        if total_estimated_time > 0:
                            team_duration = (team_end - team_start).total_seconds() / 60  # em minutos
                            time_scale = team_duration / total_estimated_time
                            
                            current_time = team_start
                            for task_idx, (task_id, estimated_time) in enumerate(zip(job.tasks_ids, task_estimated_times)):
                                # 🔧 SEQUENCIAMENTO: Cada tarefa começa quando a anterior termina
                                task_start = current_time
                                # Escalar o tempo estimado para caber no slot da equipe
                                scaled_duration = timedelta(minutes=estimated_time * time_scale)
                                task_end = task_start + scaled_duration
                                
                                team_tasks.append({
                                    "task_id": task_id,
                                    "begin_time": task_start.isoformat(),
                                    "end_time": task_end.isoformat(),
                                    "duration": scaled_duration.total_seconds(),
                                    "estimated_time": estimated_time,
                                    "scaled_duration": scaled_duration.total_seconds() / 60
                                })
                                
                                # Próxima tarefa começa quando esta termina
                                current_time = task_end
                                
                                logger.info(f"      🔧 Tarefa {task_id}: {task_start} -> {task_end} (estimado: {estimated_time}min, escalado: {scaled_duration.total_seconds()/60:.1f}min)")
                        else:
                            # Fallback: dividir tempo igualmente se não houver estimativas
                            task_duration = (team_end - team_start) / num_tasks
                            for task_idx, task_id in enumerate(job.tasks_ids):
                                task_start = team_start + (task_idx * task_duration)
                                task_end = task_start + task_duration
                                
                                team_tasks.append({
                                    "task_id": task_id,
                                    "begin_time": task_start.isoformat(),
                                    "end_time": task_end.isoformat(),
                                    "duration": task_duration.total_seconds(),
                                    "estimated_time": None,
                                    "scaled_duration": task_duration.total_seconds() / 60
                                })
                                
                                logger.warning(f"      ⚠️ Tarefa {task_id}: usando divisão igual de tempo ({task_duration.total_seconds()/60:.1f}min)")
                    
                    result["team_assignments"].append({
                        "team_name": team_name,
                        "begin_time": team_start.isoformat(),
                        "end_time": team_end.isoformat(),
                        "tasks": team_tasks  # ✅ Tarefas sequenciais para esta equipe
                    })

        results.append(result)

    return results