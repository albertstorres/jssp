from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from operation_team.models import OperationTeam
from operation_team.serializers import OperationTeamSerializer


# Create your views here.

class OperationTeamViewSet(viewsets.ModelViewSet):
    queryset = OperationTeam.objects.all()
    serializer_class = OperationTeamSerializer
    permission_classes = [IsAuthenticated]
