from rest_framework import serializers
from django.utils import timezone

from tasks.models import Task
from team_task.models import TeamTask
from teams.serializers import TeamSerializer
from operation_task.models import OperationTask


class TaskSerializer(serializers.ModelSerializer):
    operation_id = serializers.IntegerField(write_only=True, required=False)
    team_info = TeamSerializer(source='team', read_only=True)

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['finished_at']
        extra_fields = ['team_info', 'operation_info']

    def get_team_info(self, obj):
        team_task = TeamTask.objects.filter(task=obj).first()
        if team_task:
            return TeamSerializer(team_task.team).data
        return None

    def validate(self, attrs):
        team = attrs.get('team')
        status = attrs.get('status', 'pending')

        if status == 'in_progress' and team and team.is_ocupied:
            raise serializers.ValidationError({'team': 'Esta equipe já está ocupada com outra tarefa.'})

        return super().validate(attrs)

    def create(self, validated_data):
        team = validated_data.get('team')
        status = validated_data.get('status', 'pending')

        task = Task.objects.create(**validated_data)

        if team:
            TeamTask.objects.get_or_create(task=task, team=team)
            # Marca a equipe como ocupada ao criar a tarefa
            team.is_ocupied = True
            team.save()

        return task

    def update(self, instance, validated_data):
        new_status = validated_data.get('status', instance.status)
        old_status = instance.status

        # Atualiza finished_at
        if new_status == 'finished' and instance.finished_at is None:
            instance.finished_at = timezone.now()
        elif new_status != 'finished':
            instance.finished_at = None

        team = instance.team

        # Atualiza ocupação da equipe
        if team and old_status != new_status:
            if new_status == 'in_progress':
                team.is_ocupied = True
                team.save()
            elif new_status == 'finished':
                team.is_ocupied = False
                team.save()

        # Verifica se todas as tasks da operação estão finalizadas
        if new_status == 'finished':
            operation_link = OperationTask.objects.filter(task=instance).first()
            if operation_link:
                operation = operation_link.operation
                related_tasks = Task.objects.filter(operation_tasks__operation=operation)

                if related_tasks.exists() and all(task.status == 'finished' for task in related_tasks):
                    operation.finalized = True
                    operation.end = timezone.now()  # Aqui atualiza o campo end corretamente
                    operation.save()

        return super().update(instance, validated_data)