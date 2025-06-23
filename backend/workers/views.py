from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from workers.serializers import WorkerSerializer
from workers.models import Worker


class WorkerViewSet(viewsets.ModelViewSet):
    queryset = Worker.objects.all()
    serializer_class = WorkerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Worker.objects.all()
        team_id = self.request.query_params.get('team')

        if team_id:
            queryset = queryset.filter(team_id = team_id)
        return queryset