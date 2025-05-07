from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from teams.serializers import TeamSerializer
from teams.models import Team
from teams.filters import TeamFilterClass


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    rql_filter_class = TeamFilterClass
    permission_classes = [IsAuthenticated]