from dj_rql.filter_cls import AutoRQLFilterClass
from operations.models import Operation


class OperationFilterClass(AutoRQLFilterClass):
    MODEL = Operation