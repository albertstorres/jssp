from optimizations.classes.job import Jssp_job
from datetime import datetime, timedelta


class jssp:
    jobs: list

    def __init__(self, data: dict):
        self.jobs = []
        self.process_data(data)

    def process_data(self, data: dict):
       
        for job_name, details in data.get("jobs", {}).items():
            job = Jssp_job(
                name=job_name,
                usable_machines=details[0][0],
                equipments_needed=details[0][1],
                duration=details[0][2],
                task_ids=details[0][3],
                equipment_ids=details[0][4]
            )
            self.jobs.append(job)

    def get_flattened_operations(self):
        operations = []
        for job in self.jobs:
            operations.append({
                "job": job.name,
                "machines": job.usable_machines,
                "duration": job.duration
            })
        return operations
    
    
    def __str__(self) -> str:
        return "\n".join([f"Job: {job.name}, Usable Machines: {job.usable_machines}, Equipments Needed: {job.equipments_needed}, Duration: {job.duration}" for job in self.jobs])

# data = import_tests_cases("test")
# jsspTest = jssp(data)
# print(jsspTest.__str__())