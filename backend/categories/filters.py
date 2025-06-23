from dj_rql.filter_cls import AutoRQLFilterClass
from categories.models import Category


class CategorieFilterClass(AutoRQLFilterClass):
    MODEL = Category