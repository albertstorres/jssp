from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from operations.serializers import OperationListSerializer, OperationCreateSerializer
from operations.models import Operation


class OperationViewSet(viewsets.ModelViewSet):
    queryset = Operation.objects.all()
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Operation.objects.filter(finalized=False)  # Por padrão, apenas operações não finalizadas
        finalized_param = self.request.query_params.get('finalized')

        if finalized_param is not None:
            if finalized_param.lower() == 'true':
                queryset = Operation.objects.filter(finalized=True)
            elif finalized_param.lower() == 'false':
                queryset = Operation.objects.filter(finalized=False)

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return OperationCreateSerializer
        return OperationListSerializer

    @action(detail=True, methods=['post'], url_path='apply-optimization')
    def apply_optimization(self, request, pk=None):
        """
        Endpoint para aplicar os resultados da otimização e criar os registros OperationTeam
        com os horários de execução para cada equipe.
        """
        from operation_team.models import OperationTeam
        from django.utils.dateparse import parse_datetime
        
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
                    from teams.models import Team
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