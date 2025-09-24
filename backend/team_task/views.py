from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import TeamTask
from .serializers import TeamTaskSerializer
from .filters import TeamTaskFilter
import logging

# Configurar logger
logger = logging.getLogger(__name__)


class TeamTaskViewSet(viewsets.ModelViewSet):
    queryset = TeamTask.objects.all()
    serializer_class = TeamTaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [TeamTaskFilter, filters.OrderingFilter]
    ordering_fields = ['created_at', 'updated_at', 'begin', 'end']
    ordering = ['-created_at']
    
    def list(self, request, *args, **kwargs):
        """Log antes de listar"""
        logger.info(f"📋 LISTANDO TEAM_TASKS - Parâmetros: {request.query_params}")
        response = super().list(request, *args, **kwargs)
        logger.info(f"✅ TeamTasks listados: {len(response.data)} registros retornados")
        return response
    
    def retrieve(self, request, *args, **kwargs):
        """Log antes de buscar um TeamTask específico"""
        logger.info(f"🔍 BUSCANDO TEAM_TASK ID: {kwargs.get('pk')}")
        response = super().retrieve(request, *args, **kwargs)
        logger.info(f"✅ TeamTask encontrado: {response.data}")
        return response
    
    def create(self, request, *args, **kwargs):
        """Log antes de criar"""
        logger.info(f"🆕 CRIANDO NOVO TEAM_TASK - Dados: {request.data}")
        response = super().create(request, *args, **kwargs)
        logger.info(f"✅ TeamTask criado: ID {response.data.get('id')}")
        return response
    
    def update(self, request, *args, **kwargs):
        """Log antes de atualizar"""
        logger.info(f"🔄 ATUALIZANDO TEAM_TASK ID: {kwargs.get('pk')} - Dados: {request.data}")
        response = super().update(request, *args, **kwargs)
        logger.info(f"✅ TeamTask atualizado: {response.data}")
        return response
    
    def destroy(self, request, *args, **kwargs):
        """Log antes de deletar"""
        logger.info(f"🗑️ DELETANDO TEAM_TASK ID: {kwargs.get('pk')}")
        response = super().destroy(request, *args, **kwargs)
        logger.info(f"✅ TeamTask deletado com sucesso")
        return response
    
    @action(detail=False, methods=['get'])
    def gantt_data(self, request):
        """Endpoint específico para dados do Gantt Chart"""
        logger.info(f"📊 ENDPOINT GANTT_DATA ACESSADO")
        logger.info(f"   👤 Usuário: {request.user.username if request.user else 'Anônimo'}")
        logger.info(f"   📋 Parâmetros: {request.query_params}")
        
        try:
            team_tasks = TeamTask.objects.select_related(
                'team', 'task', 'task__category'
            ).all()
            
            logger.info(f"   🔍 TeamTasks encontrados: {team_tasks.count()}")
            
            gantt_data = []
            for team_task in team_tasks:
                logger.info(f"   📊 Processando TeamTask {team_task.id}: Equipe {team_task.team.name} - Tarefa {team_task.task.id}")
                logger.info(f"      📅 Horários: {team_task.begin} -> {team_task.end}")
                
                # Buscar nome da operação
                operation_name = None
                equipments = []
                try:
                    from operation_task.models import OperationTask
                    operation_task = OperationTask.objects.filter(task=team_task.task).first()
                    if operation_task:
                        operation_name = operation_task.operation.name
                        logger.info(f"      🏷️ Operação encontrada: {operation_name}")
                        
                        # Buscar equipamentos da operação
                        from equipment_operation.models import EquipmentOperation
                        equipment_ops = EquipmentOperation.objects.filter(
                            operation=operation_task.operation
                        ).select_related('equipment')
                        equipments = [eq.equipment.name for eq in equipment_ops if eq.equipment]
                        logger.info(f"      🔧 Equipamentos encontrados: {equipments}")
                    else:
                        logger.warning(f"      ⚠️ Nenhuma operação encontrada para tarefa {team_task.task.id}")
                except Exception as e:
                    logger.error(f"      ❌ Erro ao buscar operação/equipamentos: {str(e)}")
                
                gantt_entry = {
                    'operation': operation_name or f"Operação #{team_task.task.id}",
                    'task': f"Tarefa #{team_task.task.id}",
                    'equipments': equipments,
                    'team': team_task.team.name,
                    'begin': team_task.begin.isoformat() if team_task.begin else None,
                    'end': team_task.end.isoformat() if team_task.end else None
                }
                
                gantt_data.append(gantt_entry)
                logger.info(f"      ✅ Entrada Gantt criada: {gantt_entry}")
            
            logger.info(f"   📊 Total de entradas Gantt: {len(gantt_data)}")
            logger.info(f"✅ GANTT_DATA retornado com sucesso")
            
            return Response(gantt_data)
            
        except Exception as e:
            logger.error(f"❌ ERRO no endpoint gantt_data: {str(e)}")
            raise