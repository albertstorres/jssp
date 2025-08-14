from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from operations.serializers import OperationListSerializer, OperationCreateSerializer
from operations.models import Operation
from operation_team.models import OperationTeam
from django.utils.dateparse import parse_datetime
from teams.models import Team
from tasks.models import Task
from team_task.models import TeamTask
import logging

# Configurar logger
logger = logging.getLogger(__name__)


class OperationViewSet(viewsets.ModelViewSet):
    queryset = Operation.objects.all()
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        logger.info(f"🔍 CONSULTANDO OPERAÇÕES")
        logger.info(f"   📋 Parâmetros: {self.request.query_params}")
        
        queryset = Operation.objects.filter(finalized=False)
        finalized_param = self.request.query_params.get('finalized')
        
        if finalized_param is not None:
            if finalized_param.lower() == 'true':
                queryset = Operation.objects.filter(finalized=True)
                logger.info(f"   ✅ Filtro aplicado: finalized=True")
            elif finalized_param.lower() == 'false':
                queryset = Operation.objects.filter(finalized=False)
                logger.info(f"   ✅ Filtro aplicado: finalized=False")
        else:
            logger.info(f"   ✅ Filtro padrão: finalized=False")
        
        logger.info(f"   📊 Operações encontradas: {queryset.count()}")
        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            logger.debug(f"🔧 Usando serializer: OperationCreateSerializer")
            return OperationCreateSerializer
        logger.debug(f"🔧 Usando serializer: OperationListSerializer")
        return OperationListSerializer

    def list(self, request, *args, **kwargs):
        """Log antes de listar operações"""
        logger.info(f"📋 LISTANDO OPERAÇÕES")
        logger.info(f"   👤 Usuário: {request.user.username if request.user else 'Anônimo'}")
        response = super().list(request, *args, **kwargs)
        logger.info(f"✅ Operações listadas: {len(response.data)} registros retornados")
        return response

    def retrieve(self, request, *args, **kwargs):
        """Log antes de buscar uma operação específica"""
        logger.info(f"🔍 BUSCANDO OPERAÇÃO ID: {kwargs.get('pk')}")
        response = super().retrieve(request, *args, **kwargs)
        logger.info(f"✅ Operação encontrada: {response.data.get('name')}")
        return response

    def create(self, request, *args, **kwargs):
        """Log antes de criar operação"""
        logger.info(f"🆕 CRIANDO NOVA OPERAÇÃO")
        logger.info(f"   👤 Usuário: {request.user.username if request.user else 'Anônimo'}")
        logger.info(f"   📋 Dados: {request.data}")
        response = super().create(request, *args, **kwargs)
        logger.info(f"✅ Operação criada: ID {response.data.get('id')}, Nome: {response.data.get('name')}")
        return response

    def update(self, request, *args, **kwargs):
        """Log antes de atualizar operação"""
        logger.info(f"🔄 ATUALIZANDO OPERAÇÃO ID: {kwargs.get('pk')}")
        logger.info(f"   📋 Dados: {request.data}")
        response = super().update(request, *args, **kwargs)
        logger.info(f"✅ Operação atualizada: {response.data.get('name')}")
        return response

    def destroy(self, request, *args, **kwargs):
        """Log antes de deletar operação"""
        logger.info(f"🗑️ DELETANDO OPERAÇÃO ID: {kwargs.get('pk')}")
        response = super().destroy(request, *args, **kwargs)
        logger.info(f"✅ Operação deletada com sucesso")
        return response

    @action(detail=True, methods=['post'], url_path='apply-optimization')
    def apply_optimization(self, request, pk=None):
        """
        Endpoint para aplicar os resultados da otimização e criar os registros OperationTeam
        com os horários de execução para cada equipe.
        """
        
        operation = self.get_object()
        optimization_results = request.data.get('team_assignments', [])
        created_assignments = []
        errors = []
        
        for assignment in optimization_results:
            try:
                team_id = assignment.get('team_id')
                begin_time = assignment.get('begin_time')
                end_time = assignment.get('end_time')
                
                if not all([team_id, begin_time, end_time]):
                    errors.append(f"Dados incompletos para assignment: {assignment}")
                    continue
                
                # Verifica se a equipe existe
                try:
                    team = Team.objects.get(id=team_id)
                except Team.DoesNotExist:
                    errors.append(f"Equipe {team_id} não encontrada")
                    continue
                
                # Verifica se já existe um OperationTeam para esta operação e equipe
                existing_operation_team = OperationTeam.objects.filter(
                    operation=operation, 
                    team=team
                ).first()
                
                if existing_operation_team:
                    # Atualiza o existente
                    existing_operation_team.begin = parse_datetime(begin_time)
                    existing_operation_team.end = parse_datetime(end_time)
                    existing_operation_team.save()
                    created_assignments.append({
                        'id': existing_operation_team.id,
                        'operation_id': operation.id,
                        'team_id': team_id,
                        'begin_time': begin_time,
                        'end_time': end_time,
                        'action': 'updated'
                    })
                else:
                    # Cria um novo
                    operation_team = OperationTeam.objects.create(
                        operation=operation,
                        team=team,
                        begin=parse_datetime(begin_time),
                        end=parse_datetime(end_time)
                    )
                    created_assignments.append({
                        'id': operation_team.id,
                        'operation_id': operation.id,
                        'team_id': team_id,
                        'begin_time': begin_time,
                        'end_time': end_time,
                        'action': 'created'
                    })
                
                # Marca a equipe como ocupada
                team.is_ocupied = True
                team.save()
                
            except Exception as e:
                errors.append(f"Erro ao processar assignment {assignment}: {str(e)}")
        
        response_data = {
            'operation_id': operation.id,
            'operation_name': operation.name,
            'created_assignments': created_assignments,
            'errors': errors,
            'total_processed': len(optimization_results),
            'successful': len(created_assignments),
            'failed': len(errors)
        }
        
        if errors:
            return Response(response_data, status=status.HTTP_207_MULTI_STATUS)
        
        return Response(response_data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def gantt_data(self, request):
        """Endpoint para dados do Gantt Chart"""
        from team_task.models import TeamTask
        
        operations = Operation.objects.filter(finalized=False).prefetch_related(
            'operation_tasks__task'
        )
        
        gantt_data = []
        for operation in operations:
            for op_task in operation.operation_tasks.all():
                task = op_task.task
                # Usar consulta direta ao invés do relacionamento
                team_tasks = TeamTask.objects.filter(task=task)
                
                if team_tasks.exists():
                    for team_task in team_tasks:
                        gantt_data.append({
                            'operation': operation.name,
                            'task': f"Tarefa #{task.id}",
                            'equipments': [],  # Implementar se necessário
                            'team': team_task.team.name,
                            'begin': team_task.begin.isoformat() if team_task.begin else None,
                            'end': team_task.end.isoformat() if team_task.end else None
                        })
                else:
                    # Se não há equipe associada, criar entrada com "Sem equipe"
                    gantt_data.append({
                        'operation': operation.name,
                        'task': f"Tarefa #{task.id}",
                        'equipments': [],
                        'team': "Sem equipe",
                        'begin': None,
                        'end': None
                    })
        
        return Response(gantt_data)