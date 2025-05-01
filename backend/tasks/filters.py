from dj_rql.filter_cls import AutoRQLFilterClass
from tasks.models import Task


class TaskFilterClass(AutoRQLFilterClass):
    MODEL = Task