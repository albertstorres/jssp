from django.db import models
from equipment.models import Equipment
from tasks.models import Task


class EquipmentTask(models.Model):
    equipment = models.ForeignKey(
        Equipment,
        on_delete = models.PROTECT,
        null = True,
        blank = True,
        related_name = 'EquipmentTask',
        verbose_name = 'Equipamento',
    )
    task = models.ForeignKey(
        Task,
        on_delete = models.PROTECT,
        null = True,
        blank = True,
        related_name = 'Task',
        verbose_name = 'Tarefa',
    )


    class Meta:
        verbose_name = 'equipamento_tarefa'
        verbose_name_plural = 'equipamentos_tarefas'
    
    def __str__(self):
        return self.id