class Operation:
    def __init__(self, machines: list, equipments: list, duration: int, task_id: int = None):
        self.machines = machines
        self.equipments = equipments
        self.duration = duration
        self.task_id = task_id
        
    def getOperationDetails(self):
        return {
            "machines": self.machines,
            "equipments": self.equipments,
            "duration": self.duration,
            "task_id": self.task_id
        }