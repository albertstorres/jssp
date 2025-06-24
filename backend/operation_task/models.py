from django.db import models
from operations.models import Operation
from tasks.models import Task


class OperationTask(models.Model):
    operation = models.ForeignKey(
        Operation,
        on_delete=models.CASCADE,
        related_name='operation_tasks',  # Nome correto para o reverso: operation.operation_tasks.all()
        verbose_name='Operação',
    )
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='operation_tasks',  # Nome correto para o reverso: task.operation_tasks.all()
        verbose_name='Tarefa',
    )

    class Meta:
        verbose_name = 'Associação Operação-Tarefa'
        verbose_name_plural = 'Associações Operação-Tarefa'

    def __str__(self):
        return f'Operação {self.operation.id} - Tarefa {self.task.id}'