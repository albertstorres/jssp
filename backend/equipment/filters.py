from dj_rql.filter_cls import AutoRQLFilterClass
from equipment.models import Equipment


class EquipmentFilterClass(AutoRQLFilterClass):
    MODEL = Equipment