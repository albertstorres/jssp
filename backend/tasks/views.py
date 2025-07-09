from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, status
from tasks.models import Task
from tasks.serializers import TaskSerializer
from tasks.filters import TaskFilterClass
from rest_framework.decorators import action
from rest_framework.response import Response

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    rql_filter_class = TaskFilterClass
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filtros adicionais pela query string
        status_param = self.request.query_params.get('status')
        team_param = self.request.query_params.get('team')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if team_param:
            queryset = queryset.filter(team_id=team_param)

        return queryset

    @action(detail=True, methods=['patch'], url_path='start')
    def start_task(self, request, pk=None):
        task = self.get_object()

        if task.status != 'pending':
            return Response({'detail': 'A tarefa já foi iniciada ou finalizada.'}, status=status.HTTP_400_BAD_REQUEST)
        
        task.status = 'in_progress'
        task.save()

        serializer = self.get_serializer(task)
        return Response(serializer.data)