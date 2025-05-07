from django.db import models
from teams.models import Team


class Worker(models.Model):
    team = models.ForeignKey(
        Team,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='team',
        verbose_name='equipe_id',
    )
    name = models.CharField(
        max_length=50,
        verbose_name='Nome',
    )


    class Meta:
        verbose_name = 'Trabalhador'
        verbose_name_plural = 'Trabalhadores'
    
    def __str__(self):
        return self.name