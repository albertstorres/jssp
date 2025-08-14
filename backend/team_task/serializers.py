from rest_framework import serializers
from .models import TeamTask
import logging

# Configurar logger
logger = logging.getLogger(__name__)


class TeamTaskSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)
    task_name = serializers.SerializerMethodField()
    operation_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TeamTask
        fields = [
            'id', 'team', 'team_name', 'task', 'task_name', 
            'operation_name', 'begin', 'end'
        ]

    def get_team_name(self, obj):
        """Retorna o nome da equipe de forma segura"""
        team_name = obj.team.name if obj.team else None
        logger.debug(f"🔍 TeamTask {obj.id}: team_name = {team_name}")
        return team_name

    def get_task_name(self, obj):
        """Retorna a descrição da categoria da tarefa de forma segura"""
        if obj.task and obj.task.category:
            task_name = obj.task.category.description
            logger.debug(f"🔍 TeamTask {obj.id}: task_name = {task_name} (da categoria)")
        else:
            task_name = f"Tarefa #{obj.task.id}" if obj.task else None
            logger.debug(f"🔍 TeamTask {obj.id}: task_name = {task_name} (fallback)")
        return task_name

    def get_operation_name(self, obj):
        """Retorna o nome da operação associada à tarefa de forma segura"""
        try:
            from operation_task.models import OperationTask
            if obj.task:
                operation_task = OperationTask.objects.filter(task=obj.task).first()
                if operation_task and operation_task.operation:
                    operation_name = operation_task.operation.name
                    logger.debug(f"🔍 TeamTask {obj.id}: operation_name = {operation_name}")
                    return operation_name
            logger.debug(f"🔍 TeamTask {obj.id}: operation_name = None (não encontrado)")
            return None
        except Exception as e:
            logger.error(f"❌ Erro ao buscar operation_name para TeamTask {obj.id}: {str(e)}")
            return None

    def to_representation(self, instance):
        """Log antes de serializar"""
        logger.debug(f"📤 Serializando TeamTask {instance.id}: Equipe {instance.team.name if instance.team else 'None'} - Tarefa {instance.task.id if instance.task else 'None'}")
        logger.debug(f"   📅 Horários: {instance.begin} -> {instance.end}")
        
        data = super().to_representation(instance)
        logger.debug(f"   📊 Dados serializados: {data}")
        return data