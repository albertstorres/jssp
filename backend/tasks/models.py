from django.db import models
from categories.models import Category


class Task(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('in_progress', 'Em andamento'),
        ('finished', 'Finalizada'),
    ]
    status = models.CharField(
        max_length = 50,
        choices = STATUS_CHOICES,
        default = 'pending',
        verbose_name = 'Status',
    )
    category = models.ForeignKey(
        Category,
        on_delete = models.PROTECT,
        null = True,
        blank = True,
        related_name = 'Categories',
        verbose_name = 'Categoria',
    )
    created_at = models.DateTimeField(
        auto_now_add = True,
        null = True,
        verbose_name = 'Criado em',
    )
    finished_at = models.DateTimeField(
        blank = True,
        null = True,
        verbose_name = 'Finalizado em',
    )


    class Meta:
        verbose_name = 'Tarefa'
        verbose_name_plural = 'Tarefas'

    def __str__(self):
        return str(self.id)