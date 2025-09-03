import numpy as np
from .job import Jssp_job
from .operation import Operation



class jssp:
    jobs: list

    def __init__(self, data: dict):
        self.jobs = []
        self.process_data(data)

    def process_data(self, data: dict):
        jobs_data = data.get("jobs", {})
        for job_name, operations_details in jobs_data.items():
            operations = []
            for op_data in operations_details:
                machines = op_data[0]
                equipments = op_data[1]
                duration = op_data[2]
                
                # ✅ CORREÇÃO: Extrair task_id dos equipments
                task_id = None
                filtered_equipments = []
                
                for eq in equipments:
                    if eq.startswith("task_"):
                        task_id = int(eq.split("_")[1])
                    else:
                        filtered_equipments.append(eq)
                
                # ✅ CORREÇÃO: Criar operação com task_id e duração individual
                operation = Operation(machines, filtered_equipments, duration, task_id)
                operations.append(operation)
                
            job = Jssp_job(name=job_name, operations=operations)
            self.jobs.append(job)
        self.machine_downtimes = data.get("machine_downtimes", {})
        self.timespan = data.get("timespan", None)

    def get_flattened_operations(self):
        operations = []
        for job in self.jobs:
            for operation in job.operations:
                op_details = operation.getOperationDetails()
                op_details["job"] = job.name  # Adicionar o nome do job
                # ✅ CORREÇÃO: Garantir que task_id seja incluído
                if operation.task_id:
                    op_details["task_id"] = operation.task_id
                operations.append(op_details)
        return operations
    
    
    def __str__(self) -> str:
        result = []
        for job in self.jobs:
            result.append(f"Job: {job.name}")
            for idx, operation in enumerate(job.operations):
                result.append(f"  Operation {idx+1}: Machines: {operation.machines}, Equipments: {operation.equipments}, Duration: {operation.duration}")
        return "\n".join(result)

# data = import_tests_cases("test")
# jsspTest = jssp(data)
# print(jsspTest.__str__())