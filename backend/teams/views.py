from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from teams.serializers import TeamSerializer
from teams.models import Team
import logging

logger = logging.getLogger(__name__)


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Override para adicionar logs de debug"""
        queryset = Team.objects.all()
        
        # Log para debug
        logger.info(f"🔍 TeamViewSet - Parâmetros recebidos: {self.request.query_params}")
        logger.info(f"🔍 TeamViewSet - QuerySet inicial: {queryset.count()} registros")
        
        # Aplicar filtros do dj_rql (já configurado no settings)
        filtered_queryset = super().get_queryset()
        
        logger.info(f"🔍 TeamViewSet - QuerySet após filtros: {filtered_queryset.count()} registros")
        
        return filtered_queryset