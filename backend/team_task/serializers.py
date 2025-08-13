from rest_framework import serializers
from team_task.models import TeamTask


class TeamTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamTask
        fields = ['id', 'team', 'task', 'begin', 'end']