from rest_framework import serializers
from tasks.models import Task
from django.utils import timezone

from team_task.models import TeamTask

from teams.serializers import TeamSerializer


class TaskSerializer(serializers.ModelSerializer):
    operation_id = serializers.IntegerField(write_only = True, required = False)

    team_info = TeamSerializer(source = 'team', read_only = True)


    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['finished_at']
        extra_fields = ['tem_info', 'operation_info']
    
    def get_team_info(sef, obj):
        team_task = TeamTask.objects.filter(task = obj).first()

        if team_task:
            return TeamSerializer(team_task.team).data
        return None
    
    def validate(self, attrs):
        team = attrs.get('team')
        status = attrs.get('status', 'pending')

        if status == 'in_progress' and team and team.is_ocupied:
            raise serializers.ValidationError({'team': 'Esta equipe j[a está ocupada com outra tarefa.'})

        return super().validate(attrs)

    def create(self, validated_data):
        team = validated_data.get('team')
        status = validated_data.get('status', 'pending')

        task = Task.objects.create(**validated_data)

        if team:
            TeamTask.objects.get_or_create(task = task, team = team)
            
            if status == 'in_progress':
                team.is_ocupied = True
                team.save()
        
        return task

    def update(self, instance, validated_data):
        new_status = validated_data.get('status', instance.status)
        old_status = instance.status

        if new_status == 'finished' and instance.finished_at is None:
            instance.finished_at = timezone.now()
        elif new_status != 'finished':
            instance.finished_at = None
        
        team = instance.team

        if team:
            if old_status != new_status:
                if new_status == 'in_progress':
                    team.is_ocupied = True
                    team.save()
                elif new_status == 'finished':
                    team.is_ocupied = False
                    team.save()
        
        return super().update(instance, validated_data)