from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from tasks.models import Task
from tasks.serializers import TaskSerializer, TaskListSerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return TaskListSerializer
        return TaskSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filtros adicionais pela query string
        status_param = self.request.query_params.get('status')

        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset