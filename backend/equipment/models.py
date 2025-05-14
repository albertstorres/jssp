from django.db import models


class Equipment(models.Model):
    timespan = models.IntegerField(
        default=24,
        verbose_name='Período máximo para agendamento',
    )
    name = models.CharField(
        max_length=60,
        null=True,
        blank=True,
        verbose_name='Nome equipamento',
    )


    class Meta:
        verbose_name = 'Equipamento'
        verbose_name_plural = 'Equipamentos'
    
    def __str__(self):
        return self.name


class DowntimePeriod(models.Model):
    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='Equipment',
        verbose_name='Equipamento',
    )
    start_time = models.DateTimeField(
        null=True,
        blank=True,
    )
    end_time = models.DateTimeField(
        null=True,
        blank=True,
    )


    class Meta:
        verbose_name = 'Período de inatividade'
        verbose_name_plural = 'Períodos de inatividade'

    def __str__(self):
        return f"Inativo de {self.start_time} até {self.end_time}"
    
    @property
    def duration(self):
        if self.end_time and self.start_time:
            return self.end_time - self.start_time
        return None