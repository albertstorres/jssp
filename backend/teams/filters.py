from dj_rql.filter_cls import AutoRQLFilterClass
from teams.models import Team
import logging

logger = logging.getLogger(__name__)


class TeamFilterClass(AutoRQLFilterClass):
    MODEL = Team
    
    # Configurações específicas para o campo is_ocupied
    FILTERS = [
        'id',
        'name',
        'shift',
        'is_ocupied',  # Adicionado campo is_ocupied
    ]
    
    def filter_queryset(self, request, queryset, view):
        """Override para adicionar logs de debug"""
        logger.info(f"🔍 TeamFilterClass - Aplicando filtros RQL")
        logger.info(f"🔍 TeamFilterClass - QuerySet inicial: {queryset.count()} registros")
        
        # Aplicar filtros RQL
        filtered_queryset = super().filter_queryset(request, queryset, view)
        
        logger.info(f"🔍 TeamFilterClass - QuerySet após filtros: {filtered_queryset.count()} registros")
        
        return filtered_queryset