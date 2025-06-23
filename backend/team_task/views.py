from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from team_task.serializers import TeamTaskSerializer
from team_task.models import TeamTask


class TeamTaskViewSet(viewsets.ModelViewSet):
    queryset = TeamTask.objects.all()
    serializer_class = TeamTaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = TeamTask.objects.all()
        team_id = self.request.query_params.get('team')

        if team_id:
            queryset = queryset.filter(team_id = team_id)
        
        return queryset