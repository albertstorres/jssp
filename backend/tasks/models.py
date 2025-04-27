from django.db import models
from teams.models import Team
from categories.models import Categorie


class Task(models.Model):
    team = models.ForeignKey(
        Team,
        on_delete=models.PROTECT,
        related_name='Teams',
        verbose_name='Equipe',
    ),
    categorie = models.ForeignKey(
        Categorie,
        on_delete=models.PROTECT,
        related_name='Categories',
        verbose_name='Categoria',
    ),


    class Meta:
        verbose_name = 'Tarefa',
        verbose_name_plural = 'Tarefas',

    def __str__(self):
        return self.id