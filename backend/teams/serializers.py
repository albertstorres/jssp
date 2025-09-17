from rest_framework import serializers
from teams.models import Team


class TeamSerializer(serializers.ModelSerializer):
    """Serializer para equipes - retorna apenas campos obrigatórios"""
    class Meta:
        model = Team
        fields = ['id', 'name', 'is_ocupied', 'on_mount']