from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from teams.serializers import TeamSerializer
from teams.models import Team
import logging
from rest_framework.response import Response
from rest_framework.decorators import action

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
    
    @action(detail=False, methods=['get'])
    def check_status(self, request):
        """
        Endpoint para verificar e atualizar status de todas as equipes
        """
        logger.info(f"🔍 VERIFICANDO STATUS DE TODAS AS EQUIPES")
        
        results = []
        total_teams = 0
        status_changes = 0
        
        for team in Team.objects.all():
            total_teams += 1
            status_changed, old_status, new_status, message = team.check_and_update_status()
            
            if status_changed:
                status_changes += 1
                logger.info(f"   🔄 Status alterado: {team.name} {old_status} -> {new_status}")
            else:
                logger.info(f"   ℹ️ Status correto: {team.name} = {new_status}")
            
            results.append({
                'team_id': team.id,
                'team_name': team.name,
                'old_status': old_status,
                'new_status': new_status,
                'status_changed': status_changed,
                'message': message
            })
        
        logger.info(f"📊 RESUMO: {total_teams} equipes verificadas, {status_changes} alterações")
        
        return Response({
            'total_teams': total_teams,
            'status_changes': status_changes,
            'results': results
        })
    
    @action(detail=True, methods=['post'], url_path='release')
    def release_team(self, request, pk=None):
        """
        Endpoint para tentar liberar uma equipe específica
        """
        logger.info(f"🔓 TENTANDO LIBERAR EQUIPE ID: {pk}")
        
        try:
            team = Team.objects.get(id=pk)
            logger.info(f"   📋 Equipe: {team.name}")
            
            success, message = team.release_if_possible()
            
            if success:
                logger.info(f"   ✅ {message}")
                return Response({
                    'success': True,
                    'message': message,
                    'team_id': team.id,
                    'team_name': team.name,
                    'is_ocupied': team.is_ocupied
                }, status=200)
            else:
                logger.warning(f"   ⚠️ {message}")
                return Response({
                    'success': False,
                    'message': message,
                    'team_id': team.id,
                    'team_name': team.name,
                    'is_ocupied': team.is_ocupied
                }, status=400)
                
        except Team.DoesNotExist:
            logger.error(f"   ❌ Equipe não encontrada: ID {pk}")
            return Response({
                'success': False,
                'error': 'Equipe não encontrada'
            }, status=404)
        except Exception as e:
            logger.error(f"   ❌ Erro inesperado: {str(e)}")
            return Response({
                'success': False,
                'error': f'Erro inesperado: {str(e)}'
            }, status=500)