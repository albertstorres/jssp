from django.db import models


class Operation(models.Model):
    name = models.CharField(
        max_length=50,
        verbose_name='Nome',
    ),
    begin = models.DateField(
        verbose_name='Início',
    ),
    end = models.DateTimeField(
        verbose_name='Fim',
    ),
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Criado em',
    ),


    class Meta:
        verbose_name = 'Operação'
        verbose_name_plural = 'Operações'
    
    def __str__(self):
        return self.name