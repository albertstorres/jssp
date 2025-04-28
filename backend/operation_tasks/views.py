from rest_framework import viewsets
from operation_tasks.serializers import OperationTasksSerializer
from operation_tasks.models import OperationTasks


class OperationTasksViewSet(viewsets.ModelViewSet):
    queryset = OperationTasks.objects.all()
    serializer_class = OperationTasksSerializer