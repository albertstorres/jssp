from rest_framework import viewsets
from workers.serializers import WorkerSerializer
from workers.models import Worker


class WorkerViewSet(viewsets.ModelViewSet):
    queryset = Worker.objects.all()
    serializer_class = WorkerSerializer