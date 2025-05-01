from dj_rql.filter_cls import AutoRQLFilterClass
from operation_tasks.models import OperationTasks


class OperationTasksFilterClass(AutoRQLFilterClass):
    MODEL = OperationTasks