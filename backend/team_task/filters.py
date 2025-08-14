from rest_framework import filters
from .models import TeamTask
import logging

# Configurar logger
logger = logging.getLogger(__name__)


class TeamTaskFilter(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        logger.info(f"🔍 FILTRANDO TEAM_TASKS")
        logger.info(f"   📋 Queryset inicial: {queryset.count()} registros")
        logger.info(f"   📋 Parâmetros de filtro: {request.query_params}")
        
        task_param = request.query_params.get('task')
        team_param = request.query_params.get('team')
        
        if task_param:
            logger.info(f"   🎯 Aplicando filtro por tarefa: {task_param}")
            queryset = queryset.filter(task_id=task_param)
            logger.info(f"   📊 Registros após filtro de tarefa: {queryset.count()}")
        
        if team_param:
            logger.info(f"   👥 Aplicando filtro por equipe: {team_param}")
            queryset = queryset.filter(team_id=team_param)
            logger.info(f"   📊 Registros após filtro de equipe: {queryset.count()}")
        
        if not task_param and not team_param:
            logger.info(f"   ℹ️ Nenhum filtro aplicado, retornando todos os registros")
        
        logger.info(f"✅ Filtro aplicado com sucesso: {queryset.count()} registros retornados")
        return queryset
