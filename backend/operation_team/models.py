from django.db import models
from operations.models import Operation
from teams.models import Team


class OperationTeam(models.Model):
    operation = models.ForeignKey(
        Operation,
        on_delete = models.PROTECT,
        blank = True,
        null = True,
        related_name = 'OperationTeam',
        verbose_name = 'Operação', 
    )
    team = models.ForeignKey(
        Team,
        on_delete = models.PROTECT,
        blank = True,
        null = True,
        related_name = 'TeamOperation',
        verbose_name = 'Equipe',
    )
    begin = models.DateTimeField(
        blank = True,
        null = True,
        verbose_name = 'Início da execução',
    )
    end = models.DateTimeField(
        blank = True,
        null = True,
        verbose_name = 'Fim da execução',
    )


    class Meta:
        verbose_name = 'Equipe Operação'
        verbose_name_plural = 'Equipes Operações'
    
    def __str__(self):
        return f"{self.team} - {self.operation} ({self.begin} - {self.end})"
