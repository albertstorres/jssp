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
    team_tasks = serializers.SerializerMethodField()  #  Campo para dados do Gantt

    class Meta:
        model = Operation
        fields = ['id', 'name', 'finalized', 'tasks', 'equipments', 'team_tasks']  #  Adicionado team_tasks

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
        logger.info(f" CONSULTANDO TEAM_TASKS para operação: {obj.name} (ID: {obj.id})")
        
        team_tasks_data = []
        
        # Buscar todas as tarefas da operação
        operation_tasks = OperationTask.objects.filter(operation=obj)
        logger.info(f"    Tarefas da operação encontradas: {operation_tasks.count()}")
        
        # Buscar equipamentos da operação
        equipments = []
        try:
            equipment_links = EquipmentOperation.objects.filter(operation=obj)
            equipments = [eq.equipment.name for eq in equipment_links if eq.equipment]
            logger.info(f"    Equipamentos da operação: {equipments}")
        except Exception as e:
            logger.error(f"    Erro ao buscar equipamentos: {str(e)}")
        
        for op_task in operation_tasks:
            task = op_task.task
            logger.info(f"    Processando tarefa {task.id} (categoria: {task.category.description if task.category else 'Sem categoria'})")
            
            #  Usar related_name correto
            team_tasks = TeamTask.objects.filter(task=task)
            logger.info(f"       TeamTasks encontrados para tarefa {task.id}: {team_tasks.count()}")
            
            if team_tasks.exists():
                for team_task in team_tasks:
                    logger.info(f"       TeamTask {team_task.id}: Equipe {team_task.team.name} - Horários: {team_task.begin} -> {team_task.end}")
                    
                    #  CORREÇÃO: Retornar dados no formato correto para o Gantt
                    team_tasks_data.append({
                        'team': team_task.team.name,  #  Campo 'team' para o frontend
                        'task': f"Tarefa #{task.id}",  #  Campo 'task' para o frontend
                        'operation': obj.name,         #  Campo 'operation' para o frontend
                        'equipments': equipments,     #  Campo 'equipments' para o frontend
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
                    'team': "Sem equipe",              #  Campo 'team' para o frontend
                    'task': f"Tarefa #{task.id}",      #  Campo 'task' para o frontend
                    'operation': obj.name,             #  Campo 'operation' para o frontend
                    'equipments': equipments,          #  Campo 'equipments' para o frontend
                    'begin': None,                     #  Campo 'begin' para o frontend
                    'end': None,                       #  Campo 'end' para o frontend
                    # Campos adicionais para compatibilidade
                    'id': None,
                    'team_id': None,
                    'task_id': task.id,
                    'task_name': task.category.description if task.category else f"Tarefa {task.id}",
                    'status': task.status
                })
        
        logger.info(f"    Total de team_tasks retornados: {len(team_tasks_data)}")
        
        #  LOG PARA CONFIRMAR FORMATO DOS DADOS
        if team_tasks_data:
            sample_data = team_tasks_data[0]
            logger.info(f"    EXEMPLO de dados retornados:")
            logger.info(f"       team: {sample_data.get('team')}")
            logger.info(f"       task: {sample_data.get('task')}")
            logger.info(f"       operation: {sample_data.get('operation')}")
            logger.info(f"       equipments: {sample_data.get('equipments')}")
            logger.info(f"       begin: {sample_data.get('begin')}")
            logger.info(f"       end: {sample_data.get('end')}")
        
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
        """
        Validação personalizada para evitar duplicação de tarefas entre equipes
        """
        logger.info(f" VALIDANDO DADOS DA OPERAÇÃO...")
        
        task_ids = attrs.get('task_ids', [])
        team_ids = attrs.get('team_ids', [])
        
        logger.info(f"    Tarefas: {task_ids}")
        logger.info(f"    Equipes: {team_ids}")
        
        # Validação básica
        if not task_ids:
            logger.error(f"    VALIDAÇÃO FALHOU: task_ids é obrigatório")
            raise serializers.ValidationError("task_ids é obrigatório")
        
        if not team_ids:
            logger.error(f"    VALIDAÇÃO FALHOU: team_ids é obrigatório")
            raise serializers.ValidationError("team_ids é obrigatório")
        
        #  VALIDAÇÃO CRÍTICA: Verificar se há mais tarefas que equipes
        if len(task_ids) > len(team_ids):
            logger.warning(f"    ALERTA: Mais tarefas ({len(task_ids)}) que equipes ({len(team_ids)})")
            logger.warning(f"      Isso pode causar sobrecarga nas equipes")
        
        #  VALIDAÇÃO: Verificar se há tarefas duplicadas
        if len(task_ids) != len(set(task_ids)):
            logger.error(f"    VALIDAÇÃO FALHOU: Tarefas duplicadas detectadas")
            raise serializers.ValidationError("task_ids não pode conter tarefas duplicadas")
        
        #  VALIDAÇÃO: Verificar se há equipes duplicadas
        if len(team_ids) != len(set(team_ids)):
            logger.error(f"    VALIDAÇÃO FALHOU: Equipes duplicadas detectadas")
            raise serializers.ValidationError("team_ids não pode conter equipes duplicadas")
        
        logger.info(f"    VALIDAÇÃO PASSOU: Dados válidos")
        
        #  VALIDAÇÃO: Verificar se as entidades existem no banco
        logger.info(f"    Verificando existência das entidades...")
        
        # Validar se as tarefas existem
        for task_id in task_ids:
            if not Task.objects.filter(id=task_id).exists():
                logger.error(f"    VALIDAÇÃO FALHOU: Tarefa {task_id} não cadastrada")
                raise serializers.ValidationError({'task_ids': f'Tarefa {task_id} não cadastrada.'})
        
        # Validar se as equipes existem
        from teams.models import Team
        for team_id in team_ids:
            if not Team.objects.filter(id=team_id).exists():
                logger.error(f"    VALIDAÇÃO FALHOU: Equipe {team_id} não encontrada")
                raise serializers.ValidationError({'team_ids': f'Equipe {team_id} não encontrada.'})
        
        # Validar se os equipamentos existem (só se foram fornecidos)
        equipment_ids = attrs.get('equipment_ids', [])
        if equipment_ids:
            from equipment.models import Equipment
            for eq_id in equipment_ids:
                if not Equipment.objects.filter(id=eq_id).exists():
                    logger.error(f"    VALIDAÇÃO FALHOU: Equipamento {eq_id} não encontrado")
                    raise serializers.ValidationError({'equipment_ids': f'Equipamento {eq_id} não encontrado.'})
        
        logger.info(f"    VALIDAÇÃO DE EXISTÊNCIA PASSOU: Todas as entidades existem")
        
        return attrs

    def create(self, validated_data):
        logger.info(f" INICIANDO CRIAÇÃO DE OPERAÇÃO: {validated_data.get('name', 'Sem nome')}")
        
        task_ids = validated_data.pop('task_ids', [])
        equipment_ids = validated_data.pop('equipment_ids', [])
        team_ids = validated_data.pop('team_ids', [])
        optimization_type = validated_data.pop('optimization_type', None)
        
        logger.info(f" Dados recebidos:")
        logger.info(f"    Tarefas: {task_ids}")
        logger.info(f"    Equipamentos: {equipment_ids}")
        logger.info(f"    Equipes: {team_ids}")
        logger.info(f"    Tipo de otimização: {optimization_type}")

        # Buscar tarefas, equipamentos e equipes
        tasks = []
        equipments = []
        teams = []
        
        logger.info(f" Buscando entidades no banco...")
        
        for task_id in task_ids:
            try:
                task = Task.objects.get(id=task_id)
                tasks.append(task)
                logger.info(f"    Tarefa {task_id} encontrada: {task.category.description if task.category else 'Sem categoria'}")
            except Task.DoesNotExist:
                logger.error(f"    Tarefa {task_id} não encontrada!")
                raise serializers.ValidationError({'task_ids': f'Tarefa {task_id} não encontrada.'})
        
        for eq_id in equipment_ids:
            try:
                from equipment.models import Equipment
                eq = Equipment.objects.get(id=eq_id)
                equipments.append(eq)
                logger.info(f"   Equipamento {eq_id} encontrado: {eq.name}")
            except Exception as e:
                logger.error(f"   Erro ao buscar equipamento {eq_id}: {str(e)}")
                raise serializers.ValidationError({'equipment_ids': f'Equipamento {eq_id} não encontrado.'})
            
        for team_id in team_ids:
            try:
                from teams.models import Team
                team = Team.objects.get(id=team_id)
                teams.append(team)
                logger.info(f"    Equipe {team_id} encontrada: {team.name}")
            except Exception as e:
                logger.error(f"    Erro ao buscar equipe {team_id}: {str(e)}")
                raise serializers.ValidationError({'team_ids': f'Equipe {team_id} não encontrada.'})
        
        logger.info(f" Resumo das entidades encontradas:")
        logger.info(f"    Tarefas: {len(tasks)} encontradas")
        logger.info(f"    Equipamentos: {len(equipments)} encontrados")
        logger.info(f"    Equipes: {len(teams)} encontradas")

        # Montar objeto para sistema de otimização
        logger.info(f" Preparando dados para otimização...")
        
        #  CORREÇÃO: Criar estrutura com duração individual de cada tarefa
        job_operations = []
        for task in tasks:
            # Calcular duração baseada na categoria da tarefa
            if task.category and task.category.estimated_time:
                task_duration = task.category.estimated_time
                logger.info(f"    Tarefa {task.id}: Duração estimada = {task_duration} segundos")
            else:
                task_duration = 3600  # 1 hora padrão se não houver estimativa
                logger.warning(f"    Tarefa {task.id}: Sem duração estimada, usando padrão = {task_duration} segundos")
            
            #  CORREÇÃO: Estrutura correta para a classe jssp
            # A classe jssp espera: [machines, equipments, duration]
            # Vamos incluir task_id como parte dos equipments para preservar a informação
            job_operations.append((
                [team.name for team in teams],  # Equipes disponíveis (machines)
                [eq.name for eq in equipments] + [f"task_{task.id}"], # Equipamentos + ID da tarefa
                task_duration,                   # Duração individual da tarefa
            ))
            
            logger.info(f"    Operação criada para tarefa {task.id}: Duração = {task_duration}s")
        
        jobs = {
            "jobs": {
                validated_data.get("name", f"Op {timezone.now().isoformat()}"): job_operations
            }
        }
        
        logger.info(f" Dados enviados para otimização:")
        logger.info(f"    Equipes: {[team.name for team in teams]}")
        logger.info(f"    Equipamentos: {[eq.name for eq in equipments]}")
        logger.info(f"    Tarefas: {[task.id for task in tasks]}")

        try:
            # Executar otimização
            logger.info(f" Executando otimização...")
            op_data = run_optimization(jobs)  # ✅ CORREÇÃO: Retorna diretamente o resultado (Dict único)
            logger.info(f" Otimização concluída: resultado retornado")
            
            # Criar operação baseada nos resultados da otimização
            if op_data:
                logger.info(f" Dados da otimização recebidos:")
                logger.info(f"    Nome: {op_data.get('name')}")
                logger.info(f"    Begin: {op_data.get('begin')}")
                logger.info(f"    End: {op_data.get('end')}")
                logger.info(f"    Timespan: {op_data.get('timespan')}")
                logger.info(f"    Team Assignments: {len(op_data.get('team_assignments', []))}")
                
                operation = Operation.objects.create(
                    name=validated_data.get('name', op_data.get('name', f'Op {timezone.now().isoformat()}')),
                    begin=timezone.datetime.fromisoformat(op_data.get('begin')),
                    end=timezone.datetime.fromisoformat(op_data.get('end')),
                    timespan=op_data.get('timespan', 3600),
                    finalized=False,
                    **{k: v for k, v in validated_data.items() if k not in ['name', 'begin', 'end', 'timespan', 'finalized']}
                )
                logger.info(f" Operação criada: ID {operation.id}, Nome: {operation.name}")
                
                # Criar registros OperationTeam baseados na otimização
                if op_data.get('team_assignments'):
                    logger.info(f" Criando OperationTeam baseado na otimização para {len(op_data['team_assignments'])} equipes")
                    for team_assignment in op_data['team_assignments']:
                        team_name = team_assignment['team']  # ✅ CORREÇÃO: 'team' em vez de 'team_name'
                        logger.info(f"    Processando equipe {team_name} da otimização")
                        # Encontrar a equipe pelo nome
                        team = next((t for t in teams if t.name == team_name), None)
                        if team:
                            # Verificar se já existe um OperationTeam para esta combinação
                            existing_operation_team = OperationTeam.objects.filter(operation=operation, team=team).first()
                            if existing_operation_team:
                                logger.info(f"   ℹ OperationTeam já existia via otimização: Operação {operation.name} -> Equipe {team.name} (ID: {existing_operation_team.id})")
                            else:
                                # ✅ CORREÇÃO: Usar horários globais da operação para OperationTeam
                                operation_team = OperationTeam.objects.create(
                                    operation=operation,
                                    team=team,
                                    begin=timezone.datetime.fromisoformat(op_data['begin']),
                                    end=timezone.datetime.fromisoformat(op_data['end'])
                                )
                                logger.info(f"    OperationTeam criado via otimização: Operação {operation.name} -> Equipe {team.name} (ID: {operation_team.id})")
                            # Marcar equipe como ocupada
                            team.is_ocupied = True
                            team.save()
                            logger.info(f"    Equipe {team.name} marcada como ocupada via otimização")
                        else:
                            logger.warning(f"    Equipe {team_name} da otimização não encontrada na lista de equipes fornecidas")
                else:
                    logger.warning(f" Nenhuma atribuição de equipe encontrada na otimização")
                
            else:
                # Fallback: criar operação com dados básicos
                logger.warning(f" Fallback: criando operação com dados básicos (sem otimização)")
                op_data = None
                operation = Operation.objects.create(
                    name=validated_data.get('name', f'Op {timezone.now().isoformat()}'),
                    begin=timezone.now(),
                    end=timezone.now() + timedelta(hours=1),
                    timespan=3600,
                    finalized=False,
                    **{k: v for k, v in validated_data.items() if k not in ['name', 'begin', 'end', 'timespan', 'finalized']}
                )
                logger.info(f" Operação criada (fallback): ID {operation.id}, Nome: {operation.name}")
            
        except Exception as e:
            # Em caso de erro na otimização, criar operação básica
            logger.error(f" Erro na otimização: {str(e)}")
            logger.warning(f" Fallback: criando operação com dados básicos (erro na otimização)")
            op_data = None
            operation = Operation.objects.create(
                name=validated_data.get('name', f'Op {timezone.now().isoformat()}'),
                begin=timezone.now(),
                end=timezone.now() + timedelta(hours=1),
                timespan=3600,
                finalized=False,
                **{k: v for k, v in validated_data.items() if k not in ['name', 'begin', 'end', 'timespan', 'finalized']}
            )
            logger.info(f" Operação criada (fallback): ID {operation.id}, Nome: {operation.name}")

        # Associar tarefas
        logger.info(f" Associando tarefas à operação...")
        
        #  CORREÇÃO: Rastrear tarefas já atribuídas para evitar duplicação
        assigned_tasks = set()
        team_task_count = 0
        
        for task in tasks:
            logger.info(f"    Processando tarefa {task.id}")
            
            #  VALIDAÇÃO: Verificar se a tarefa já foi atribuída
            if task.id in assigned_tasks:
                logger.warning(f"    Tarefa {task.id} já foi processada, pulando...")
                continue
            
            # Verificar se já existe um OperationTask para esta combinação
            existing_operation_task = OperationTask.objects.filter(operation=operation, task=task).first()
            if existing_operation_task:
                logger.info(f"   ℹ OperationTask já existia: Operação {operation.name} -> Tarefa {task.id} (ID: {existing_operation_task.id})")
            else:
                # Criar novo OperationTask
                operation_task = OperationTask.objects.create(operation=operation, task=task)
                logger.info(f"    OperationTask criado: Operação {operation.name} -> Tarefa {task.id} (ID: {operation_task.id})")
            
            # Atualizar status da tarefa se estiver pendente
            if task.status == 'pending':
                task.status = 'in_progress'
                task.save()
                logger.info(f"    Status da tarefa {task.id} alterado de 'pending' para 'in_progress'")

            # Associar tarefa às equipes da operação via TeamTask
            if teams:  # Verificar se há equipes antes de criar TeamTask
                logger.info(f"    Processando atribuição de tarefa {task.id}...")
                
                #  CORREÇÃO CRÍTICA: Buscar a atribuição específica da otimização para esta tarefa
                assigned_team = None
                task_begin = None
                task_end = None
                
                if op_data and op_data.get('team_assignments'):
                    logger.info(f"       Buscando atribuição específica da otimização para tarefa {task.id}")
                    
                    # Procurar em todas as atribuições de equipe pela tarefa específica
                    for team_assignment in op_data['team_assignments']:
                        if 'tasks' in team_assignment and team_assignment['tasks']:
                            # Buscar a tarefa específica na lista de tarefas da equipe
                            task_assignment = next(
                                (ta for ta in team_assignment['tasks'] if ta['task_id'] == task.id), 
                                None
                            )
                            if task_assignment:
                                #  TAREFA ENCONTRADA: Usar esta equipe específica
                                team_name = team_assignment['team']  # ✅ CORREÇÃO: 'team' em vez de 'team_name'
                                assigned_team = next((t for t in teams if t.name == team_name), None)
                                task_begin = timezone.datetime.fromisoformat(task_assignment['begin_time'])
                                task_end = timezone.datetime.fromisoformat(task_assignment['end_time'])
                                
                                logger.info(f"       Tarefa {task.id} atribuída à equipe {team_name} via otimização")
                                logger.info(f"         Horários: {task_begin} -> {task_end}")
                                break
                    
                    if not assigned_team:
                        logger.warning(f"       Tarefa {task.id} não encontrada na otimização - usando fallback")
                
                #  CORREÇÃO: Se não há atribuição específica, usar lógica de fallback
                if not assigned_team:
                    # Fallback: distribuir tarefas sequencialmente entre equipes disponíveis
                    available_teams = [t for t in teams if not t.is_ocupied]
                    if available_teams:
                        # Usar índice da tarefa para distribuir entre equipes disponíveis
                        task_index = tasks.index(task)
                        assigned_team = available_teams[task_index % len(available_teams)]
                        
                        # Calcular horários sequenciais baseados na duração da tarefa
                        if task.category and task.category.estimated_time:
                            task_duration = task.category.estimated_time
                        else:
                            task_duration = 3600  # 1 hora padrão
                        
                        # Usar horários da operação como base
                        task_begin = operation.begin
                        task_end = operation.begin + timedelta(seconds=task_duration)
                        
                        logger.info(f"       Fallback: Tarefa {task.id} atribuída à equipe {assigned_team.name}")
                        logger.info(f"         Horários calculados: {task_begin} -> {task_end}")
                    else:
                        logger.error(f"       Nenhuma equipe disponível para tarefa {task.id}")
                        continue
                
                #  CORREÇÃO: Criar APENAS UM TeamTask para esta tarefa
                if assigned_team:
                    logger.info(f"       Criando TeamTask único para tarefa {task.id} -> equipe {assigned_team.name}")
                    
                    # Verificar se já existe um TeamTask para esta combinação
                    existing_team_task = TeamTask.objects.filter(task=task, team=assigned_team).first()
                    if existing_team_task:
                        logger.info(f"      ℹ TeamTask já existia: Tarefa {task.id} -> Equipe {assigned_team.name} (ID: {existing_team_task.id})")
                        team_task = existing_team_task
                    else:
                        # Criar novo TeamTask com a equipe específica
                        team_task = TeamTask.objects.create(
                            task=task,
                            team=assigned_team,
                            begin=task_begin,
                            end=task_end
                        )
                        logger.info(f"       TeamTask criado: Tarefa {team_task.task.id} -> Equipe {team_task.team.name} (ID: {team_task.id})")
                        team_task_count += 1
                    
                    logger.info(f"       TeamTask {team_task.id}: Tarefa {team_task.task.id} -> Equipe {team_task.team.name} (begin: {team_task.begin}, end: {team_task.end})")
                    
                    # Verificar se foi salvo corretamente no banco
                    saved_team_task = TeamTask.objects.filter(task=task, team=assigned_team).first()
                    if saved_team_task:
                        logger.info(f"       TeamTask confirmado no banco: ID {saved_team_task.id}")
                    else:
                        logger.error(f"       TeamTask NÃO encontrado no banco após criação!")
                    
                    #  VALIDAÇÃO: Marcar tarefa como atribuída
                    assigned_tasks.add(task.id)
                    logger.info(f"       Tarefa {task.id} marcada como atribuída à equipe {assigned_team.name}")
                else:
                    logger.error(f"       Não foi possível atribuir equipe para tarefa {task.id}")
            else:
                logger.warning(f"    Nenhuma equipe fornecida para criar TeamTask")
        
        #  VALIDAÇÃO FINAL: Verificar se todas as tarefas foram atribuídas corretamente
        logger.info(f" RESUMO FINAL DA ATRIBUIÇÃO:")
        logger.info(f"    Total de tarefas processadas: {len(tasks)}")
        logger.info(f"    Total de TeamTasks criados: {team_task_count}")
        logger.info(f"    Tarefas atribuídas: {len(assigned_tasks)}")
        logger.info(f"    IDs das tarefas atribuídas: {sorted(assigned_tasks)}")
        
        if len(assigned_tasks) != len(tasks):
            logger.warning(f"    ALERTA: Nem todas as tarefas foram atribuídas!")
            missing_tasks = [task.id for task in tasks if task.id not in assigned_tasks]
            logger.warning(f"    Tarefas não atribuídas: {missing_tasks}")
        else:
            logger.info(f"    SUCESSO: Todas as tarefas foram atribuídas corretamente!")
        
        #  CORREÇÃO: Marcar equipes como ocupadas após atribuição
        logger.info(f" Atualizando status das equipes...")
        for team in teams:
            if team.is_ocupied != True:  # Só atualizar se não estiver já ocupada
                team.is_ocupied = True
                team.save()
                logger.info(f"    Equipe {team.name} marcada como ocupada")
            else:
                logger.info(f"   ℹ Equipe {team.name} já estava ocupada")
        
        return operation
    
    def finalize_operation(self, operation):
        """
        Finaliza uma operação (NÃO libera equipes automaticamente)
        Uma equipe só é liberada quando TODAS as suas tarefas estão finalizadas
        """
        logger.info(f" FINALIZANDO OPERAÇÃO: {operation.name} (ID: {operation.id})")
        
        try:
            # Marcar operação como finalizada
            operation.finalized = True
            operation.save()
            logger.info(f"    Operação marcada como finalizada")
            
            #  CORREÇÃO: NÃO liberar equipes automaticamente
            # As equipes só devem ser liberadas quando TODAS as suas tarefas estiverem finalizadas
            logger.info(f"   ℹ Equipes NÃO liberadas automaticamente")
            logger.info(f"   ℹ Equipes serão liberadas apenas quando todas as suas tarefas estiverem finalizadas")
            
            logger.info(f"    OPERAÇÃO FINALIZADA COM SUCESSO: {operation.name}")
            return True
            
        except Exception as e:
            logger.error(f"    ERRO ao finalizar operação: {str(e)}")
            return False