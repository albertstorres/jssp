from dj_rql.filter_cls import AutoRQLFilterClass
from categories.models import Categorie


class CategorieFilterClass(AutoRQLFilterClass):
    MODEL = Categorie