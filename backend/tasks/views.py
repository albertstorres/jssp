from rest_framework.permissions import DjangoModelPermissions
from rest_framework import viewsets
from tasks.models import Task
from tasks.serializers import TaskSerealizer
from tasks.filters import TaskFilterClass


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerealizer
    rql_filter_class = TaskFilterClass
    permission_classes = [DjangoModelPermissions]