from django.db import models
from equipment.models import Equipment
from operations.models import Operation


class EquipmentOperation(models.Model):
    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='equipment_operations',
        verbose_name='Equipamento',
    )
    operation = models.ForeignKey(
        Operation,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='operation_equipments',
        verbose_name='Operação',
    )

    class Meta:
        verbose_name = 'Equipamento da Operação'
        verbose_name_plural = 'Equipamentos das Operações'

    def __str__(self):
        return f'{self.equipment} - {self.operation}'