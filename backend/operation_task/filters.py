from dj_rql.filter_cls import AutoRQLFilterClass
from operation_task.models import OperationTask


class OperationTaskFilterClass(AutoRQLFilterClass):
    MODEL = OperationTask