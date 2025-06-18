from rest_framework import serializers
from tasks.models import Task
from django.utils import timezone

from team_task.models import TeamTask
from equipment_task.models import EquipmentTask
from equipment.models import Equipment

from teams.serializers import TeamSerializer
from equipment.serializers import EquipmentSerializer


class TaskSerializer(serializers.ModelSerializer):
    equipment_id = serializers.IntegerField(write_only = True, required = False)
    operation_id = serializers.IntegerField(write_only = True, required = False)

    team_info = TeamSerializer(source = 'team', read_only = True)
    equipment_info = serializers.SerializerMethodField()


    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['finished_at']
        extra_fields = ['tem_info', 'equipment_info', 'operation_info']
    
    def get_equipment_info(sef, obj):
        equipment_task = EquipmentTask.objects.filter(task = obj).first()

        if equipment_task:
            return EquipmentSerializer(equipment_task.equipment).data
        return None
    
    def get_team_info(sef, obj):
        team_task = TeamTask.objects.filter(task = obj).first()

        if team_task:
            return TeamSerializer(team_task.team).data
        return None
    
    def validate(self, attrs):
        team = attrs.get('team')
        status = attrs.get('status', 'pending')

        if status == 'in_progress' and team and team.is_ocupied:
            raise serializers.ValidationError({'team': 'Esta equipe j[a está ocupada com outra tarefa.'})

        equipment_id = self.initial_data.get('equipment_id')

        if equipment_id:
            try: 
                equipment = Equipment.objects.get(id = equipment_id)
                if equipment.is_ocupied:
                    raise serializers.ValidationError({'equipment_id': 'Equipamento sendo utilizado em outra tarefa.'})
            except Equipment.DoesNotExist:
                raise serializers.ValidationError({'equipment_id': 'Equipamento não cadastrado.'})

        return super().validate(attrs)

    def create(self, validated_data):
        equipment_id = validated_data.pop('equipment_id', None)
        team = validated_data.get('team')
        status = validated_data.get('status', 'pending')

        task = Task.objects.create(**validated_data)

        if team:
            TeamTask.objects.get_or_create(task = task, team = team)
            
            if status == 'in_progress':
                team.is_ocupied = True
                team.save()

        if equipment_id:
            try:
                equipment = Equipment.objects.get(id = equipment_id)
                EquipmentTask.objects.get_or_create(task = task, equipment = equipment)

                if status == 'in_progress':
                    equipment.is_ocupied = True
                    equipment.save()

            except Equipment.DoesNotExist:
                raise serializers.ValidationError({'equipment_id':'Equipamento não cadastrado.'})
        
        return task

    def update(self, instance, validated_data):
        new_status = validated_data.get('status', instance.status)
        old_status = instance.status

        if new_status == 'finished' and instance.finished_at is None:
            instance.finished_at = timezone.now()
        elif new_status != 'finished':
            instance.finished_at = None
        
        team = instance.team

        if team:
            if old_status != new_status:
                if new_status == 'in_progress':
                    team.is_ocupied = True
                    team.save()
                elif new_status == 'finished':
                    team.is_ocupied = False
                    team.save()
        
        equipment_task = EquipmentTask.objects.filter(task = instance).first()
        equipment = equipment_task.equipment if equipment_task else None

        if equipment and old_status != new_status:
            if new_status == 'in_progress':
                equipment.is_ocupied = True
            elif new_status == 'finished':
                equipment.is_ocupied = False
            equipment.save()
        
        return super().update(instance, validated_data)