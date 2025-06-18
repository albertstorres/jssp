from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from team_task.serializers import TeamTaskSerializer
from team_task.models import TeamTask


class TeamTaskViewSet(viewsets.ModelViewSet):
    queryset = TeamTask.objects.all()
    serializer_class = TeamTaskSerializer
    permission_classes = [IsAuthenticated]