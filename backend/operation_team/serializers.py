from rest_framework import serializers
from operation_team.models import OperationTeam
from teams.serializers import TeamSerializer
from operations.serializers import OperationListSerializer


class OperationTeamSerializer(serializers.ModelSerializer):
    team = TeamSerializer(read_only=True)
    team_id = serializers.IntegerField(write_only=True)
    operation = OperationListSerializer(read_only=True)
    operation_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = OperationTeam
        fields = ['id', 'team', 'team_id', 'operation', 'operation_id', 'begin', 'end']
        read_only_fields = ['id']

    def create(self, validated_data):
        team_id = validated_data.pop('team_id')
        operation_id = validated_data.pop('operation_id')
        
        from teams.models import Team
        from operations.models import Operation
        
        team = Team.objects.get(id=team_id)
        operation = Operation.objects.get(id=operation_id)
        
        return OperationTeam.objects.create(team=team, operation=operation, **validated_data)
