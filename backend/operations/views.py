from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from operation_tasks.models import OperationTasks
from operation_tasks.serializers import OperationTasksSerializer
from operation_tasks.filters import OperationTasksFilterClass


class OperationTasksViewSet(viewsets.ModelViewSet):
    queryset = OperationTasks.objects.all()
    serializer_class = OperationTasksSerializer
    rql_filter_class = OperationTasksFilterClass
    permission_classes = [IsAuthenticated]