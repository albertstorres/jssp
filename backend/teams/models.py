from django.db import models


class Team(models.Model):
    shift = models.IntegerField(
        default=8,
        verbose_name='Turno',
    )
    name = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name='Nome',
    )
    is_ocupied = models.BooleanField(
        default = False,
        verbose_name = 'Está ocupado',
    )


    class Meta:
        verbose_name = 'Equipe'
        verbose_name_plural = 'Equipes'
    
    def __str__(self):
        return self.name