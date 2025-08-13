from django.db import models
from teams.models import Team
from tasks.models import Task


class TeamTask(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete = models.PROTECT,
        blank = True,
        null = True,
        related_name = 'TaskTeam',
        verbose_name = 'Tarefa', 
    )
    team = models.ForeignKey(
        Team,
        on_delete = models.PROTECT,
        blank = True,
        null = True,
        related_name = 'TeamTask',
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
        verbose_name = 'Equipe Tarefa'
        verbose_name_plural = 'Equipes Tarefas'
    
    def __str__(self):
        return f"{self.team} - {self.task} ({self.begin} - {self.end})"