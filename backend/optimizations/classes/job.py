class Jssp_job:
    def __init__(self, name, usable_machines, equipments_needed, duration, task_ids, equipment_ids):
        self.name = name
        self.usable_machines = usable_machines
        self.equipments_needed = equipments_needed
        self.duration = duration
        self.tasks_ids = task_ids
        self.equipments_ids = equipment_ids