from django.db import models


class Categorie(models.Model):
    description = models.CharField(
        max_length=60,
        verbose_name='Descrição',
    ),
    estimated_time = models.PositiveIntegerField(
        verbose_name='Estimativa de tempo'
    )
    priority = models.CharField(
        max_length=30,
        verbose_name='Prioridade'
    )


    class Meta:
        verbose_name='Categoria'
        verbose_name_plural='Categorias'
    
    def __str__(self):
        return self.description