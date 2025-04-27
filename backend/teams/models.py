from django.db import models


class Team(models.Model):
    shift = models.IntegerField(
        verbose_name='Turno',
    ),
    name = models.CharField(
        max_length=50,
        verbose_name='Nome',
    ),


    class Meta:
        verbose_name = 'Equipe'
        verbose_name_plural = 'Equipes'
    
    def __str__(self):
        return self.name