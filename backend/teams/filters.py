from dj_rql.filter_cls import AutoRQLFilterClass
from teams.models import Team


class TeamFilterClass(AutoRQLFilterClass):
    MODEL = Team