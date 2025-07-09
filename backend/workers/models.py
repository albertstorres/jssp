from django.db import models
from django.contrib.auth.models import User
from teams.models import Team


class Worker(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='UsersWorkers',
        verbose_name='UsuárioTrabalhador',
    )
    team = models.ForeignKey(
        Team,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='team',
        verbose_name='equipe_id',
    )
    first_name = models.CharField(
        max_length=50,
        verbose_name='Nome',
    )
    last_name = models.CharField(
        max_length=50,
        verbose_name='Sobrenome',
    )

    class Meta:
        verbose_name = 'Trabalhador'
        verbose_name_plural = 'Trabalhadores'

    def __str__(self):
        return f"{self.first_name} {self.last_name}"