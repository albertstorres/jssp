from django.db import models
from django.contrib.auth.models import User


class Operator(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='Users',
        verbose_name='Usuário',
    )


    class Meta:
        verbose_name = 'Operador'
        verbose_name_plural = 'Operadores'
    
    def __str__(self):
        return self.id