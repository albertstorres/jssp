import requests
from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
import logging

from operations.models import Operation
from tasks.models import Task
from operation_task.models import OperationTask
from equipment_operation.models import EquipmentOperation
from team_task.models import TeamTask
from operation_team.models import OperationTeam

from optimizations.classic_optimization import run_optimization

# Configurar logger
logger = logging.getLogger(__name__)

# Endpoints externos
#OPTIMIZATION_ENDPOINTS = {
#    'classic': 'http://localhost:5000/optimize/classic',
#    'quantum': 'http://localhost:5000/optimize/quantum',
#}


# Serializer para listar operações com tasks e equipamentos associados
class OperationListSerializer(serializers.ModelSerializer):
    tasks = serializers.SerializerMethodField()
    equipments = serializers.SerializerMethodField()
    team_tasks = serializers.SerializerMethodField()  # ✅ Campo para dados do Gantt

    class Meta:
        model = Operation
        fields = ['id', 'name', 'finalized', 'tasks', 'equipments', 'team_tasks']  # ✅ Adicionado team_tasks

    def get_tasks(self, obj):
        """Retorna array com IDs das tarefas"""
        operation_tasks = OperationTask.objects.filter(operation=obj)
        return [op_task.task.id for op_task in operation_tasks]

    def get_equipments(self, obj):
        """Retorna array com nomes dos equipamentos"""
        equipment_links = EquipmentOperation.objects.filter(operation=obj)
        return [eq.equipment.name for eq in equipment_links if eq.equipment]

    def get_team_tasks(self, obj):
        """Retorna dados completos de team_tasks para o Gantt Chart"""
        logger.info(f"🔍 CONSULTANDO TEAM_TASKS para operação: {obj.name} (ID: {obj.id})")
        
        team_tasks_data = []
        
        # Buscar todas as tarefas da operação
        operation_tasks = OperationTask.objects.filter(operation=obj)
        logger.info(f"   📋 Tarefas da operação encontradas: {operation_tasks.count()}")
        
        # Buscar equipamentos da operação
        equipments = []
        try:
            equipment_links = EquipmentOperation.objects.filter(operation=obj)
            equipments = [eq.equipment.name for eq in equipment_links if eq.equipment]
            logger.info(f"   🔧 Equipamentos da operação: {equipments}")
        except Exception as e:
            logger.error(f"   ❌ Erro ao buscar equipamentos: {str(e)}")
        
        for op_task in operation_tasks:
            task = op_task.task
            logger.info(f"   🔍 Processando tarefa {task.id} (categoria: {task.category.description if task.category else 'Sem categoria'})")
            
            # ✅ Usar related_name correto
            team_tasks = TeamTask.objects.filter(task=task)
            logger.info(f"      👥 TeamTasks encontrados para tarefa {task.id}: {team_tasks.count()}")
            
            if team_tasks.exists():
                for team_task in team_tasks:
                    logger.info(f"      📊 TeamTask {team_task.id}: Equipe {team_task.team.name} - Horários: {team_task.begin} -> {team_task.end}")
                    
                    # 🔧 CORREÇÃO: Retornar dados no formato correto para o Gantt
                    team_tasks_data.append({
                        'team': team_task.team.name,  # ✅ Campo 'team' para o frontend
                        'task': f"Tarefa #{task.id}",  # ✅ Campo 'task' para o frontend
                        'operation': obj.name,         # ✅ Campo 'operation' para o frontend
                        'equipments': equipments,     # ✅ Campo 'equipments' para o frontend
                        'begin': team_task.begin.isoformat() if team_task.begin else None,  # ✅ Campo 'begin' para o frontend
                        'end': team_task.end.isoformat() if team_task.end else None,        # ✅ Campo 'end' para o frontend
                        # Campos adicionais para compatibilidade
                        'id': team_task.id,
                        'team_id': team_task.team.id,
                        'task_id': task.id,
                        'task_name': task.category.description if task.category else f"Tarefa {task.id}",
                        'status': task.status
                    })
            else:
                logger.warning(f"      ⚠️ Nenhum TeamTask encontrado para tarefa {task.id} - criando entrada 'Sem equipe'")
                # Se não há equipe associada, criar entrada com dados básicos
                team_tasks_data.append({
                    'team': "Sem equipe",              # ✅ Campo 'team' para o frontend
                    'task': f"Tarefa #{task.id}",      # ✅ Campo 'task' para o frontend
                    'operation': obj.name,             # ✅ Campo 'operation' para o frontend
                    'equipments': equipments,          # ✅ Campo 'equipments' para o frontend
                    'begin': None,                     # ✅ Campo 'begin' para o frontend
                    'end': None,                       # ✅ Campo 'end' para o frontend
                    # Campos adicionais para compatibilidade
                    'id': None,
                    'team_id': None,
                    'task_id': task.id,
                    'task_name': task.category.description if task.category else f"Tarefa {task.id}",
                    'status': task.status
                })
        
        logger.info(f"   📊 Total de team_tasks retornados: {len(team_tasks_data)}")
        
        # 🔧 LOG PARA CONFIRMAR FORMATO DOS DADOS
        if team_tasks_data:
            sample_data = team_tasks_data[0]
            logger.info(f"   📋 EXEMPLO de dados retornados:")
            logger.info(f"      🏷️ team: {sample_data.get('team')}")
            logger.info(f"      🎯 task: {sample_data.get('task')}")
            logger.info(f"      🏢 operation: {sample_data.get('operation')}")
            logger.info(f"      🔧 equipments: {sample_data.get('equipments')}")
            logger.info(f"      📅 begin: {sample_data.get('begin')}")
            logger.info(f"      📅 end: {sample_data.get('end')}")
        
        return team_tasks_data


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
        logger.info(f"🚀 INICIANDO CRIAÇÃO DE OPERAÇÃO: {validated_data.get('name', 'Sem nome')}")
        
        task_ids = validated_data.pop('task_ids', [])
        equipment_ids = validated_data.pop('equipment_ids', [])
        team_ids = validated_data.pop('team_ids', [])
        optimization_type = validated_data.pop('optimization_type', None)
        
        logger.info(f"📋 Dados recebidos:")
        logger.info(f"   🎯 Tarefas: {task_ids}")
        logger.info(f"   🔧 Equipamentos: {equipment_ids}")
        logger.info(f"   👥 Equipes: {team_ids}")
        logger.info(f"   ⚙️ Tipo de otimização: {optimization_type}")

        # Buscar tarefas, equipamentos e equipes
        tasks = []
        equipments = []
        teams = []
        
        logger.info(f"🔍 Buscando entidades no banco...")
        
        for task_id in task_ids:
            try:
                task = Task.objects.get(id=task_id)
                tasks.append(task)
                logger.info(f"   ✅ Tarefa {task_id} encontrada: {task.category.description if task.category else 'Sem categoria'}")
            except Task.DoesNotExist:
                logger.error(f"   ❌ Tarefa {task_id} não encontrada!")
                raise serializers.ValidationError({'task_ids': f'Tarefa {task_id} não encontrada.'})
        
        for eq_id in equipment_ids:
            try:
                from equipment.models import Equipment
                eq = Equipment.objects.get(id=eq_id)
                equipments.append(eq)
                logger.info(f"   ✅ Equipamento {eq_id} encontrado: {eq.name}")
            except Exception as e:
                logger.error(f"   ❌ Erro ao buscar equipamento {eq_id}: {str(e)}")
                raise serializers.ValidationError({'equipment_ids': f'Equipamento {eq_id} não encontrado.'})
            
        for team_id in team_ids:
            try:
                from teams.models import Team
                team = Team.objects.get(id=team_id)
                teams.append(team)
                logger.info(f"   ✅ Equipe {team_id} encontrada: {team.name}")
            except Exception as e:
                logger.error(f"   ❌ Erro ao buscar equipe {team_id}: {str(e)}")
                raise serializers.ValidationError({'team_ids': f'Equipe {team_id} não encontrada.'})
        
        logger.info(f"📊 Resumo das entidades encontradas:")
        logger.info(f"   🎯 Tarefas: {len(tasks)} encontradas")
        logger.info(f"   🔧 Equipamentos: {len(equipments)} encontrados")
        logger.info(f"   👥 Equipes: {len(teams)} encontradas")

        # Montar objeto para sistema de otimização
        logger.info(f"⚙️ Preparando dados para otimização...")
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
        
        logger.info(f"📤 Dados enviados para otimização:")
        logger.info(f"   👥 Equipes: {[team.name for team in teams]}")
        logger.info(f"   🔧 Equipamentos: {[eq.name for eq in equipments]}")
        logger.info(f"   🎯 Tarefas: {[task.id for task in tasks]}")

        try:
            # Executar otimização
            logger.info(f"🚀 Executando otimização...")
            external_operations = run_optimization(jobs)
            logger.info(f"✅ Otimização concluída: {len(external_operations)} operações retornadas")
            
            # Criar operação baseada nos resultados da otimização
            if external_operations and len(external_operations) > 0:
                op_data = external_operations[0]  # Pega a primeira operação
                logger.info(f"📊 Dados da otimização recebidos:")
                logger.info(f"   🏷️ Nome: {op_data.get('name')}")
                logger.info(f"   📅 Begin: {op_data.get('begin')}")
                logger.info(f"   📅 End: {op_data.get('end')}")
                logger.info(f"   ⏱️ Timespan: {op_data.get('timespan')}")
                logger.info(f"   👥 Team Assignments: {len(op_data.get('team_assignments', []))}")
                
                operation = Operation.objects.create(
                    name=validated_data.get('name', op_data.get('name', f'Op {timezone.now().isoformat()}')),
                    begin=timezone.datetime.fromisoformat(op_data.get('begin')),
                    end=timezone.datetime.fromisoformat(op_data.get('end')),
                    timespan=op_data.get('timespan', 3600),
                    finalized=False,
                    **{k: v for k, v in validated_data.items() if k not in ['name', 'begin', 'end', 'timespan', 'finalized']}
                )
                logger.info(f"✅ Operação criada: ID {operation.id}, Nome: {operation.name}")
                
                # Criar registros OperationTeam baseados na otimização
                if op_data.get('team_assignments'):
                    logger.info(f"👥 Criando OperationTeam baseado na otimização para {len(op_data['team_assignments'])} equipes")
                    for team_assignment in op_data['team_assignments']:
                        team_name = team_assignment['team_name']
                        logger.info(f"   🔍 Processando equipe {team_name} da otimização")
                        # Encontrar a equipe pelo nome
                        team = next((t for t in teams if t.name == team_name), None)
                        if team:
                            # Verificar se já existe um OperationTeam para esta combinação
                            existing_operation_team = OperationTeam.objects.filter(operation=operation, team=team).first()
                            if existing_operation_team:
                                logger.info(f"   ℹ️ OperationTeam já existia via otimização: Operação {operation.name} -> Equipe {team.name} (ID: {existing_operation_team.id})")
                            else:
                                operation_team = OperationTeam.objects.create(
                                    operation=operation,
                                    team=team,
                                    begin=timezone.datetime.fromisoformat(team_assignment['begin_time']),
                                    end=timezone.datetime.fromisoformat(team_assignment['end_time'])
                                )
                                logger.info(f"   ✅ OperationTeam criado via otimização: Operação {operation.name} -> Equipe {team.name} (ID: {operation_team.id})")
                            # Marcar equipe como ocupada
                            team.is_ocupied = True
                            team.save()
                            logger.info(f"   ✅ Equipe {team.name} marcada como ocupada via otimização")
                        else:
                            logger.warning(f"   ⚠️ Equipe {team_name} da otimização não encontrada na lista de equipes fornecidas")
                else:
                    logger.warning(f"⚠️ Nenhuma atribuição de equipe encontrada na otimização")
                
            else:
                # Fallback: criar operação com dados básicos
                logger.warning(f"⚠️ Fallback: criando operação com dados básicos (sem otimização)")
                op_data = None
                operation = Operation.objects.create(
                    name=validated_data.get('name', f'Op {timezone.now().isoformat()}'),
                    begin=timezone.now(),
                    end=timezone.now() + timedelta(hours=1),
                    timespan=3600,
                    finalized=False,
                    **{k: v for k, v in validated_data.items() if k not in ['name', 'begin', 'end', 'timespan', 'finalized']}
                )
                logger.info(f"✅ Operação criada (fallback): ID {operation.id}, Nome: {operation.name}")
            
        except Exception as e:
            # Em caso de erro na otimização, criar operação básica
            logger.error(f"❌ Erro na otimização: {str(e)}")
            logger.warning(f"⚠️ Fallback: criando operação com dados básicos (erro na otimização)")
            op_data = None
            operation = Operation.objects.create(
                name=validated_data.get('name', f'Op {timezone.now().isoformat()}'),
                begin=timezone.now(),
                end=timezone.now() + timedelta(hours=1),
                timespan=3600,
                finalized=False,
                **{k: v for k, v in validated_data.items() if k not in ['name', 'begin', 'end', 'timespan', 'finalized']}
            )
            logger.info(f"✅ Operação criada (fallback): ID {operation.id}, Nome: {operation.name}")

        # Associar tarefas
        logger.info(f"🔗 Associando tarefas à operação...")
        for task in tasks:
            logger.info(f"   🔍 Processando tarefa {task.id}")
            
            # Verificar se já existe um OperationTask para esta combinação
            existing_operation_task = OperationTask.objects.filter(operation=operation, task=task).first()
            if existing_operation_task:
                logger.info(f"   ℹ️ OperationTask já existia: Operação {operation.name} -> Tarefa {task.id} (ID: {existing_operation_task.id})")
            else:
                # Criar novo OperationTask
                operation_task = OperationTask.objects.create(operation=operation, task=task)
                logger.info(f"   ✅ OperationTask criado: Operação {operation.name} -> Tarefa {task.id} (ID: {operation_task.id})")
            
            # Atualizar status da tarefa se estiver pendente
            if task.status == 'pending':
                task.status = 'in_progress'
                task.save()
                logger.info(f"   ✅ Status da tarefa {task.id} alterado de 'pending' para 'in_progress'")

            # Associar tarefa às equipes da operação via TeamTask
            if teams:  # Verificar se há equipes antes de criar TeamTask
                logger.info(f"   👥 Criando TeamTask para tarefa {task.id}...")
                for team in teams:
                    logger.info(f"      🔍 Processando equipe {team.name} (ID: {team.id}) para tarefa {task.id}")
                    
                    # Verificar se já existe um TeamTask para esta combinação
                    existing_team_task = TeamTask.objects.filter(task=task, team=team).first()
                    if existing_team_task:
                        logger.info(f"      ℹ️ TeamTask já existia: Tarefa {task.id} -> Equipe {team.name} (ID: {existing_team_task.id})")
                        team_task = existing_team_task
                    else:
                        # 🔧 CORREÇÃO: Usar horários específicos da equipe da otimização
                        team_begin = operation.begin
                        team_end = operation.end
                        
                        # Se temos dados de otimização, usar horários específicos da equipe
                        if op_data and op_data.get('team_assignments'):
                            team_assignment = next(
                                (ta for ta in op_data['team_assignments'] if ta['team_name'] == team.name), 
                                None
                            )
                            if team_assignment:
                                # 🔧 CORREÇÃO CRÍTICA: Usar horários sequenciais das tarefas da otimização
                                if 'tasks' in team_assignment and team_assignment['tasks']:
                                    # Buscar a tarefa específica na lista de tarefas da equipe
                                    task_assignment = next(
                                        (ta for ta in team_assignment['tasks'] if ta['task_id'] == task.id), 
                                        None
                                    )
                                    if task_assignment:
                                        # ✅ USAR HORÁRIOS SEQUENCIAIS DA OTIMIZAÇÃO
                                        team_begin = timezone.datetime.fromisoformat(task_assignment['begin_time'])
                                        team_end = timezone.datetime.fromisoformat(task_assignment['end_time'])
                                        logger.info(f"      ✅ Usando horários sequenciais da otimização para {team.name} - Tarefa {task.id}: {team_begin} -> {team_end}")
                                    else:
                                        logger.warning(f"      ⚠️ Tarefa {task.id} não encontrada na otimização da equipe {team.name}, usando horários da equipe")
                                        team_begin = timezone.datetime.fromisoformat(team_assignment['begin_time'])
                                        team_end = timezone.datetime.fromisoformat(team_assignment['end_time'])
                                else:
                                    # Fallback: usar horários da equipe se não houver tarefas específicas
                                    logger.warning(f"      ⚠️ Equipe {team.name} não tem tarefas sequenciais na otimização, usando horários da equipe")
                                    team_begin = timezone.datetime.fromisoformat(team_assignment['begin_time'])
                                    team_end = timezone.datetime.fromisoformat(team_assignment['end_time'])
                            else:
                                logger.warning(f"      ⚠️ Equipe {team.name} não encontrada na otimização, usando horários da operação")
                        else:
                            logger.info(f"      ℹ️ Sem dados de otimização, usando horários da operação para {team.name}")
                        
                        # Criar novo TeamTask com horários sequenciais da otimização
                        logger.info(f"      🆕 Criando TeamTask com horários sequenciais: {team_begin} -> {team_end}")
                        team_task = TeamTask.objects.create(
                            task=task,
                            team=team,
                            begin=team_begin,  # ✅ Horário sequencial da otimização
                            end=team_end       # ✅ Horário sequencial da otimização
                        )
                        logger.info(f"      ✅ TeamTask criado: Tarefa {team_task.task.id} -> Equipe {team_task.team.name} (ID: {team_task.id})")
                    
                    logger.info(f"      📊 TeamTask {team_task.id}: Tarefa {team_task.task.id} -> Equipe {team_task.team.name} (begin: {team_task.begin}, end: {team_task.end})")
                    
                    # Verificar se foi salvo corretamente no banco
                    saved_team_task = TeamTask.objects.filter(task=task, team=team).first()
                    if saved_team_task:
                        logger.info(f"      ✅ TeamTask confirmado no banco: ID {saved_team_task.id}")
                    else:
                        logger.error(f"      ❌ TeamTask NÃO encontrado no banco após criação!")
            else:
                logger.warning(f"   ⚠️ Nenhuma equipe fornecida para criar TeamTask")

        # Criar registros OperationTeam para todas as equipes da operação (só se não foram criados via otimização)
        logger.info(f"👥 Criando registros OperationTeam restantes...")
        teams_with_operation_team = set()
        if op_data and op_data.get('team_assignments'):
            for team_assignment in op_data['team_assignments']:
                team_name = team_assignment['team_name']
                team = next((t for t in teams if t.name == team_name), None)
                if team:
                    teams_with_operation_team.add(team.id)
                    logger.info(f"   ℹ️ Equipe {team.name} já tem OperationTeam via otimização")
        
        for team in teams:
            if team.id not in teams_with_operation_team:
                logger.info(f"   🔍 Criando OperationTeam para equipe {team.name}...")
                # Verificar se já existe um OperationTeam para esta combinação
                existing_operation_team = OperationTeam.objects.filter(operation=operation, team=team).first()
                if existing_operation_team:
                    logger.info(f"   ℹ️ OperationTeam já existia: Operação {operation.name} -> Equipe {team.name} (ID: {existing_operation_team.id})")
                else:
                    # Criar novo OperationTeam
                    operation_team = OperationTeam.objects.create(
                        operation=operation,
                        team=team,
                        begin=operation.begin,
                        end=operation.end
                    )
                    logger.info(f"   ✅ OperationTeam criado: Operação {operation.name} -> Equipe {team.name} (ID: {operation_team.id})")
            else:
                logger.info(f"   ℹ️ OperationTeam já foi criado via otimização para equipe {team.name}")

        # Associar equipamentos (só se foram fornecidos)
        if equipment_ids:
            logger.info(f"🔧 Associando equipamentos à operação...")
            for equipment in equipments:
                logger.info(f"   🔍 Processando equipamento {equipment.name}...")
                # Verificar se já existe um EquipmentOperation para esta combinação
                existing_equipment_operation = EquipmentOperation.objects.filter(operation=operation, equipment=equipment).first()
                if existing_equipment_operation:
                    logger.info(f"   ℹ️ EquipmentOperation já existia: Operação {operation.name} -> Equipamento {equipment.name} (ID: {existing_equipment_operation.id})")
                else:
                    # Criar novo EquipmentOperation
                    equipment_operation = EquipmentOperation.objects.create(operation=operation, equipment=equipment)
                    logger.info(f"   ✅ EquipmentOperation criado: Operação {operation.name} -> Equipamento {equipment.name} (ID: {equipment_operation.id})")

        # Marcar equipes como ocupadas se não foram marcadas pela otimização
        if team_ids and (not op_data or not op_data.get('team_assignments')):
            logger.info(f"👥 Marcando equipes como ocupadas (fallback)...")
            for team in teams:
                team.is_ocupied = True
                team.save()
                logger.info(f"   ✅ Equipe {team.name} marcada como ocupada (fallback)")
        
        # Marcar todas as equipes como ocupadas (independente da otimização)
        logger.info(f"👥 Marcando todas as equipes como ocupadas...")
        for team in teams:
            team.is_ocupied = True
            team.save()
            logger.info(f"   ✅ Equipe {team.name} marcada como ocupada na operação {operation.name}")
        
        logger.info(f"🎉 OPERAÇÃO CRIADA COM SUCESSO: ID {operation.id}, Nome: {operation.name}")
        logger.info(f"📊 RESUMO FINAL:")
        logger.info(f"   🎯 Tarefas associadas: {len(tasks)}")
        logger.info(f"   👥 Equipes associadas: {len(teams)}")
        logger.info(f"   🔧 Equipamentos associados: {len(equipments)}")
        logger.info(f"   📅 Horários: {operation.begin} -> {operation.end}")
        
        return operation