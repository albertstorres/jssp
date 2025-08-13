import numpy as np
from optimizations.classes.jssp import jssp
from mealpy import SA
from mealpy.utils.space import FloatVar
from django.utils import timezone
from datetime import timedelta
import logging

# Configurar logging para reduzir verbosidade
logging.getLogger('mealpy').setLevel(logging.WARNING)


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
        
        # Adicionar alocação de equipes baseada no schedule
        if hasattr(job, 'usable_machines') and job.usable_machines:
            for i, team_name in enumerate(job.usable_machines):
                if team_name != "Unknown":
                    # Calcular horários para cada equipe
                    team_start = start_datetime + timedelta(seconds=start + (i * (end - start) / len(job.usable_machines)))
                    team_end = start_datetime + timedelta(seconds=start + ((i + 1) * (end - start) / len(job.usable_machines)))
                    
                    result["team_assignments"].append({
                        "team_name": team_name,
                        "begin_time": team_start.isoformat(),
                        "end_time": team_end.isoformat()
                    })

        results.append(result)

    return results