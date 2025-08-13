from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from team_task.models import TeamTask
from team_task.serializers import TeamTaskSerializer


class TeamTaskViewSet(viewsets.ModelViewSet):
    queryset = TeamTask.objects.all()
    serializer_class = TeamTaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = TeamTask.objects.all()
        task_param = self.request.query_params.get('task')
        
        if task_param:
            queryset = queryset.filter(task_id=task_param)
            
        return queryset