from dj_rql.filter_cls import AutoRQLFilterClass
from operators.models import Operator


class OperatorFilterClass(AutoRQLFilterClass):
    MODEL = Operator