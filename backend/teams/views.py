from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from teams.serializers import TeamSerializer
from teams.models import Team


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]