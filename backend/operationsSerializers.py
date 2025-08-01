import requests
from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta

from operations.models import Operation
from tasks.models import Task
from operation_task.models import OperationTask
from equipment_operation.models import EquipmentOperation

from optimizations.classic_optimization import run_optimization

# Endpoints externos
#OPTIMIZATION_ENDPOINTS = {
#    'classic': 'http://localhost:5000/optimize/classic',
#    'quantum': 'http://localhost:5000/optimize/quantum',
#}


# Serializer auxiliar para informações da equipe (sem equipment_info)
class TaskInfoSerializer(serializers.ModelSerializer):
    team_info = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ['id', 'team_info']

    def get_team_info(self, obj):
        if obj.team:
            return {
                "id": obj.team.id,
                "name": obj.team.name,
                "shift": obj.team.shift,
                "is_ocupied": obj.team.is_ocupied,
            }
        return None


# Serializer para listar operações com tasks e equipamentos associados
class OperationListSerializer(serializers.ModelSerializer):
    tasks = serializers.SerializerMethodField()
    equipments = serializers.SerializerMethodField()

    class Meta:
        model = Operation
        fields = [
            'id', 'name', 'begin', 'end', 'created_at',
            'timespan', 'finalized', 'tasks', 'equipments'
        ]

    def get_tasks(self, obj):
        operation_tasks = OperationTask.objects.filter(operation=obj)
        tasks = [op_task.task for op_task in operation_tasks]
        return TaskInfoSerializer(tasks, many=True).data

    def get_equipments(self, obj):
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
    optimization_type = serializers.ChoiceField(
        choices=['classic', 'quantum'], write_only=True, required=True
    )

    class Meta:
        model = Operation
        fields = '__all__'
        read_only_fields = ['begin', 'end']

    def create(self, validated_data):
        task_ids = validated_data.pop('task_ids', [])
        equipment_ids = validated_data.pop('equipment_ids', [])
        optimization_type = validated_data.pop('optimization_type', None)

        #base_time = timezone.now()
        total_duration = timedelta()
        tasks = []

        from teams.models import Team  # Para atualizar equipe dentro do loop
        from equipment.models import Equipment

        # Buscar tarefas e somar tempo total
        for task_id in task_ids:
            try:
                task = Task.objects.get(id=task_id)
                tasks.append(task)
                if task.category and task.category.estimated_time:
                    total_duration += timedelta(seconds=task.category.estimated_time)
            except Task.DoesNotExist:
                raise serializers.ValidationError({'task_ids': f'Tarefa {task_id} não cadastrada.'})

        equipments = []
        for eq_id in equipment_ids:
            try:
                eq = Equipment.objects.get(id=eq_id)
                equipments.append(eq)
            except Equipment.DoesNotExist:
                raise serializers.ValidationError({'equipment_ids': f'Equipamento {eq_id} não encontrado.'})
        
        # Montar objeto para sistema externo
        jobs = {
            "jobs": {
                validated_data.get("name", f"Op {timezone.now().isoformat()}"): [(
                    [f"Machine {task.team.id}" if task.team else "Unknown" for task in tasks],  #usable_machines
                    [eq.name for eq in equipments], #equipments_needed
                    int(total_duration.total_seconds()), #duration
                    [task.id for task in tasks], #task_ids
                    [eq.id for eq in equipments] #equipment_ids
                )]
            }
        }

        #endpoint = OPTIMIZATION_ENDPOINTS.get(optimization_type)
        #if not endpoint:
        #    raise serializers.ValidationError({'optimization_type': 'Tipo de otimização inválido'})
        #
        #try:
        #    response = requests.post(endpoint, json=jobs)
        #    response.raise_for_status()
        #    external_operations = response.json()
        #except requests.RequestException as e:
        #    raise serializers.ValidationError({'external_error': str(e)})

        external_operations = run_optimization(jobs)
        print(external_operations)
        
        # Retorno esperado:
        #[
        #{
        #    "name": "Op A",
        #    "begin": "2025-07-01T10:00:00",
        #    "end": "2025-07-01T12:00:00",
        #    "timespan": 7200,
        #    "task_ids": [1, 2],
        #    "equipment_ids": [5, 6]
        #},
        #...
        #]
        
        #created_operations = []
        #for op_data in external_operations:
        #    operation = Operation.objects.create(
        #        name = op_data.get('name'),
        #        begin = timezone.make_aware(timezone.datetime.fromisoformat(op_data.get('begin'))),
        #        end = timezone.make_aware(timezone.datetime.fromisoformat(op_data.get('end'))),
        #        timespan = op_data.get('timespan'),
        #        finalized = op_data.get('finalized', False),
        #        **validated_data
        #    )
        #created_operations.append(operation)

        # Criar a operação antiga
        #operation = Operation.objects.create(
        #    begin=base_time,
        #    end=base_time + total_duration,
        #    timespan=int(total_duration.total_seconds()),
        #    **validated_data
        #)

        # Associar tarefas + atualizar status + setar equipe como ocupada
        #for task in tasks:
        #    OperationTask.objects.get_or_create(operation=operation, task=task)
        #
        #    if task.status == 'pending':
        #        task.status = 'in_progress'
        #        task.save()
        #
        #        # Se a tarefa tiver uma equipe, marca como ocupada
        #        if task.team:
        #            task.team.is_ocupied = True
        #            task.team.save()

        # Associar equipamentos (se houver)
        #if equipment_ids:
        #    from equipment.models import Equipment
        #    for eq_id in equipment_ids:
        #        try:
        #            eq = Equipment.objects.get(id=eq_id)
        #            EquipmentOperation.objects.get_or_create(operation=operation, equipment=eq)
        #        except Equipment.DoesNotExist:
        #            raise serializers.ValidationError({'equipment_ids': f'Equipamento {eq_id} não encontrado.'})

        #return created_operations[0] if len(created_operations) == 1 else created_operations
        return external_operations