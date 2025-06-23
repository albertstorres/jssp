from django.db.models.signals import post_save
from django.dispatch import receiver
from tasks.models import Task
from operation_task.models import OperationTask
from operations.models import Operation

@receiver(post_save, sender = Task)
def check_and_finalize_operation(sender, instance, **kwargs):
    operation_tasks = OperationTask.objects.filter(task = instance)

    for op_task in operation_tasks:
        operation = op_task.operation
        related_tasks = OperationTask.objects.filter(operation = operation).select_related('task')

        all_finished = all(
            ot.task.status == 'finished'
            for ot in related_tasks
        )

        if all_finished and not operation.finalized:
            operation.finalized = True
            operation.save()
        elif not all_finished and operation.finalized:
            operation.finalized = False
            operation.save()