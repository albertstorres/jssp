from django.db import models
from operations.models import Operation
from tasks.models import Task


class OperationTask(models.Model):
    operation = models.ForeignKey(
        Operation,
        on_delete=models.CASCADE,
        related_name='Operations',
        verbose_name='Operação',
    )
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='Tasks',
        verbose_name='Tarefa',
    )


    class Meta:
        verbose_name = 'Operação'
        verbose_name_plural = 'Operações'
    
    def __str__(self):
        return self.id