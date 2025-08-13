import requests
from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta

from operations.models import Operation
from tasks.models import Task
from operation_task.models import OperationTask
from equipment_operation.models import EquipmentOperation
from operation_team.models import OperationTeam

from optimizations.classic_optimization import run_optimization

# Endpoints externos
#OPTIMIZATION_ENDPOINTS = {
#    'classic': 'http://localhost:5000/optimize/classic',
#    'quantum': 'http://localhost:5000/optimize/quantum',
#}


# Serializer para listar operações com tasks e equipamentos associados
class OperationListSerializer(serializers.ModelSerializer):
    tasks = serializers.SerializerMethodField()
    equipments = serializers.SerializerMethodField()

    class Meta:
        model = Operation
        fields = ['id', 'name', 'finalized', 'tasks', 'equipments']

    def get_tasks(self, obj):
        """Retorna array com IDs das tarefas"""
        operation_tasks = OperationTask.objects.filter(operation=obj)
        return [op_task.task.id for op_task in operation_tasks]

    def get_equipments(self, obj):
        """Retorna array com nomes dos equipamentos"""
        equipment_links = EquipmentOperation.objects.filter(operation=obj)
        return [eq.equipment.name for eq in equipment_links if eq.equipment]


# Serializer para criação de operação (com task_ids e equipment_ids como entrada)
class OperationCreateSerializer(serializers.ModelSerializer):
    task_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=True
    )

    equipment_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    team_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=True
    )
    
    optimization_type = serializers.ChoiceField(
        choices=['classic', 'quantum'], write_only=True, required=True
    )

    class Meta:
        model = Operation
        fields = '__all__'
        read_only_fields = ['begin', 'end', 'timespan', 'finalized']

    def validate(self, attrs):
        task_ids = attrs.get('task_ids', [])
        equipment_ids = attrs.get('equipment_ids', [])
        team_ids = attrs.get('team_ids', [])
        
        # Validar se as tarefas existem
        for task_id in task_ids:
            if not Task.objects.filter(id=task_id).exists():
                raise serializers.ValidationError({'task_ids': f'Tarefa {task_id} não cadastrada.'})
        
        # Validar se os equipamentos existem (só se foram fornecidos)
        if equipment_ids:
            from equipment.models import Equipment
            for eq_id in equipment_ids:
                if not Equipment.objects.filter(id=eq_id).exists():
                    raise serializers.ValidationError({'equipment_ids': f'Equipamento {eq_id} não encontrado.'})
        
        # Validar se as equipes existem e não estão vazias
        if not team_ids:
            raise serializers.ValidationError({'team_ids': 'Pelo menos uma equipe deve ser fornecida.'})
        
        from teams.models import Team
        for team_id in team_ids:
            if not Team.objects.filter(id=team_id).exists():
                raise serializers.ValidationError({'team_ids': f'Equipe {team_id} não encontrada.'})
        
        return attrs

    def create(self, validated_data):
        task_ids = validated_data.pop('task_ids', [])
        equipment_ids = validated_data.pop('equipment_ids', [])
        team_ids = validated_data.pop('team_ids', [])
        optimization_type = validated_data.pop('optimization_type', None)

        # Buscar tarefas, equipamentos e equipes
        tasks = []
        equipments = []
        teams = []
        
        for task_id in task_ids:
            task = Task.objects.get(id=task_id)
            tasks.append(task)
        
        for eq_id in equipment_ids:
            from equipment.models import Equipment
            eq = Equipment.objects.get(id=eq_id)
            equipments.append(eq)
            
        for team_id in team_ids:
            from teams.models import Team
            team = Team.objects.get(id=team_id)
            teams.append(team)
        
        print(f"DEBUG: Operação '{validated_data.get('name')}' - Tarefas: {len(tasks)}, Equipamentos: {len(equipments)}, Equipes: {len(teams)}")
        print(f"DEBUG: IDs das equipes: {team_ids}")
        print(f"DEBUG: Nomes das equipes: {[team.name for team in teams]}")

        # Montar objeto para sistema de otimização
        jobs = {
            "jobs": {
                validated_data.get("name", f"Op {timezone.now().isoformat()}"): [(
                    [team.name for team in teams] if teams else ["Unknown"],  # usable_machines (nomes das equipes)
                    [eq.name for eq in equipments], # equipments_needed
                    3600, # duration padrão em segundos (1 hora)
                    [task.id for task in tasks], # task_ids
                    [eq.id for eq in equipments] # equipment_ids
                )]
            }
        }

        try:
            # Executar otimização
            external_operations = run_optimization(jobs)
            
            # Criar operação baseada nos resultados da otimização
            if external_operations and len(external_operations) > 0:
                op_data = external_operations[0]  # Pega a primeira operação
                
                operation = Operation.objects.create(
                    name=validated_data.get('name', op_data.get('name', f'Op {timezone.now().isoformat()}')),
                    begin=timezone.datetime.fromisoformat(op_data.get('begin')),
                    end=timezone.datetime.fromisoformat(op_data.get('end')),
                    timespan=op_data.get('timespan', 3600),
                    finalized=False,
                    **{k: v for k, v in validated_data.items() if k not in ['name', 'begin', 'end', 'timespan', 'finalized']}
                )
                
                # Criar registros OperationTeam baseados na otimização
                if op_data.get('team_assignments'):
                    from operation_team.models import OperationTeam
                    print(f"DEBUG: Criando OperationTeam baseado na otimização para {len(op_data['team_assignments'])} equipes")
                    for team_assignment in op_data['team_assignments']:
                        team_name = team_assignment['team_name']
                        print(f"DEBUG: Processando equipe {team_name} da otimização")
                        # Encontrar a equipe pelo nome
                        team = next((t for t in teams if t.name == team_name), None)
                        if team:
                            # Verificar se já existe um OperationTeam para esta combinação
                            existing_operation_team = OperationTeam.objects.filter(operation=operation, team=team).first()
                            if existing_operation_team:
                                print(f"DEBUG: ℹ️ OperationTeam já existia via otimização: Operação {operation.name} -> Equipe {team.name} (ID: {existing_operation_team.id})")
                            else:
                                operation_team = OperationTeam.objects.create(
                                    operation=operation,
                                    team=team,
                                    begin=timezone.datetime.fromisoformat(team_assignment['begin_time']),
                                    end=timezone.datetime.fromisoformat(team_assignment['end_time'])
                                )
                                print(f"DEBUG: ✅ OperationTeam criado via otimização: Operação {operation.name} -> Equipe {team.name} (ID: {operation_team.id})")
                            # Marcar equipe como ocupada
                            team.is_ocupied = True
                            team.save()
                            print(f"DEBUG: ✅ Equipe {team.name} marcada como ocupada via otimização")
                        else:
                            print(f"DEBUG: ⚠️ Equipe {team_name} da otimização não encontrada na lista de equipes fornecidas")
                else:
                    print(f"DEBUG: ⚠️ Nenhuma atribuição de equipe encontrada na otimização")
                
            else:
                # Fallback: criar operação com dados básicos
                op_data = None
                operation = Operation.objects.create(
                    name=validated_data.get('name', f'Op {timezone.now().isoformat()}'),
                    begin=timezone.now(),
                    end=timezone.now() + timedelta(hours=1),
                    timespan=3600,
                    finalized=False,
                    **{k: v for k, v in validated_data.items() if k not in ['name', 'begin', 'end', 'timespan', 'finalized']}
                )
            
        except Exception as e:
            # Em caso de erro na otimização, criar operação básica
            op_data = None
            operation = Operation.objects.create(
                name=validated_data.get('name', f'Op {timezone.now().isoformat()}'),
                begin=timezone.now(),
                end=timezone.now() + timedelta(hours=1),
                timespan=3600,
                finalized=False,
                **{k: v for k, v in validated_data.items() if k not in ['name', 'begin', 'end', 'timespan', 'finalized']}
            )

        # Associar tarefas
        for task in tasks:
            # Verificar se já existe um OperationTask para esta combinação
            existing_operation_task = OperationTask.objects.filter(operation=operation, task=task).first()
            if existing_operation_task:
                print(f"DEBUG: ℹ️ OperationTask já existia: Operação {operation.name} -> Tarefa {task.id} (ID: {existing_operation_task.id})")
            else:
                # Criar novo OperationTask
                operation_task = OperationTask.objects.create(operation=operation, task=task)
                print(f"DEBUG: ✅ OperationTask criado: Operação {operation.name} -> Tarefa {task.id} (ID: {operation_task.id})")
            
            # Atualizar status da tarefa se estiver pendente
            if task.status == 'pending':
                task.status = 'in_progress'
                task.save()
                print(f"DEBUG: ✅ Status da tarefa {task.id} alterado de 'pending' para 'in_progress'")

            # Associar tarefa às equipes da operação via TeamTask
            if teams:  # Verificar se há equipes antes de criar TeamTask
                for team in teams:
                    print(f"DEBUG: Tentando criar TeamTask para Tarefa {task.id} -> Equipe {team.name} (ID: {team.id})")
                    
                    # Verificar se já existe um TeamTask para esta combinação
                    existing_team_task = TeamTask.objects.filter(task=task, team=team).first()
                    if existing_team_task:
                        print(f"DEBUG: ℹ️ TeamTask já existia: Tarefa {task.id} -> Equipe {team.name} (ID: {existing_team_task.id})")
                        team_task = existing_team_task
                    else:
                        # Criar novo TeamTask
                        team_task = TeamTask.objects.create(
                            task=task,
                            team=team,
                            begin=operation.begin,
                            end=operation.end
                        )
                        print(f"DEBUG: ✅ TeamTask criado: Tarefa {task.id} -> Equipe {team.name} (ID: {team_task.id})")
                    
                    print(f"DEBUG: TeamTask {team_task.id}: Tarefa {team_task.task.id} -> Equipe {team_task.team.name} (begin: {team_task.begin}, end: {team_task.end})")
                    
                    # Verificar se foi salvo corretamente no banco
                    saved_team_task = TeamTask.objects.filter(task=task, team=team).first()
                    if saved_team_task:
                        print(f"DEBUG: ✅ TeamTask confirmado no banco: ID {saved_team_task.id}")
                    else:
                        print(f"DEBUG: ❌ TeamTask NÃO encontrado no banco após criação!")
            else:
                print(f"DEBUG: ⚠️ Nenhuma equipe fornecida para criar TeamTask")

        # Criar registros OperationTeam para todas as equipes da operação (só se não foram criados via otimização)
        teams_with_operation_team = set()
        if op_data and op_data.get('team_assignments'):
            for team_assignment in op_data['team_assignments']:
                team_name = team_assignment['team_name']
                team = next((t for t in teams if t.name == team_name), None)
                if team:
                    teams_with_operation_team.add(team.id)
        
        for team in teams:
            if team.id not in teams_with_operation_team:
                # Verificar se já existe um OperationTeam para esta combinação
                existing_operation_team = OperationTeam.objects.filter(operation=operation, team=team).first()
                if existing_operation_team:
                    print(f"DEBUG: ℹ️ OperationTeam já existia: Operação {operation.name} -> Equipe {team.name} (ID: {existing_operation_team.id})")
                else:
                    # Criar novo OperationTeam
                    operation_team = OperationTeam.objects.create(
                        operation=operation,
                        team=team,
                        begin=operation.begin,
                        end=operation.end
                    )
                    print(f"DEBUG: ✅ OperationTeam criado: Operação {operation.name} -> Equipe {team.name} (ID: {operation_team.id})")
            else:
                print(f"DEBUG: ℹ️ OperationTeam já foi criado via otimização para equipe {team.name}")

        # Associar equipamentos (só se foram fornecidos)
        if equipment_ids:
            for equipment in equipments:
                # Verificar se já existe um EquipmentOperation para esta combinação
                existing_equipment_operation = EquipmentOperation.objects.filter(operation=operation, equipment=equipment).first()
                if existing_equipment_operation:
                    print(f"DEBUG: ℹ️ EquipmentOperation já existia: Operação {operation.name} -> Equipamento {equipment.name} (ID: {existing_equipment_operation.id})")
                else:
                    # Criar novo EquipmentOperation
                    equipment_operation = EquipmentOperation.objects.create(operation=operation, equipment=equipment)
                    print(f"DEBUG: ✅ EquipmentOperation criado: Operação {operation.name} -> Equipamento {equipment.name} (ID: {equipment_operation.id})")

        # Marcar equipes como ocupadas se não foram marcadas pela otimização
        if team_ids and (not op_data or not op_data.get('team_assignments')):
            for team in teams:
                team.is_ocupied = True
                team.save()
                print(f"DEBUG: Equipe {team.name} marcada como ocupada (fallback)")
        
        # Marcar todas as equipes como ocupadas (independente da otimização)
        for team in teams:
            team.is_ocupied = True
            team.save()
            print(f"DEBUG: Equipe {team.name} marcada como ocupada na operação {operation.name}")
        
        return operation