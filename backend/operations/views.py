from rest_framework import viewsets
from operation_tasks.models import OperationTasks
from operation_tasks.serializers import OperationTasksSerializer


class OperationTasksViewSet(viewsets.ModelViewSet):
    queryset = OperationTasks.objects.all()
    serializer_class = OperationTasksSerializer