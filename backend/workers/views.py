from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from workers.serializers import WorkerSerializer
from workers.models import Worker
from workers.filters import WorkerFilterClass


class WorkerViewSet(viewsets.ModelViewSet):
    queryset = Worker.objects.all()
    serializer_class = WorkerSerializer
    rql_filter_class = WorkerFilterClass
    permission_classes = [IsAuthenticated]