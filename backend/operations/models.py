from django.db import models


class Operation(models.Model):
    name = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name='Nome',
    )
    begin = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Início',
    )
    end = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fim',
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        null=True,
        verbose_name='Criado em',
    )


    class Meta:
        verbose_name = 'Operação'
        verbose_name_plural = 'Operações'
    
    def __str__(self):
        return self.name