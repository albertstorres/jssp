from dj_rql.filter_cls import AutoRQLFilterClass
from workers.models import Worker


class WorkerFilterClass(AutoRQLFilterClass):
    MODEL = Worker