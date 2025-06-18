from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta

from operations.models import Operation
from tasks.models import Task
from operation_task.models import OperationTask



class OpearionSerializer(serializers.ModelSerializer):
    task_ids = serializers.ListField(
        child = serializers.IntegerField(), 
        write_only = True, 
        required = True
    )


    class Meta:
        model = Operation
        fields = '__all__'
        read_only_fields = ['begin', 'end']
    
    def create(self, validated_data):
        task_ids = validated_data.pop('task_ids', [])
        base_time = timezone.now()
        total_duration = timedelta()
        tasks = []

        for task_id in task_ids:
            try:
                task = Task.objects.get(id = task_id)
                tasks.append(task)

                if task.categorie and task.categorie.estimated_time:
                    total_duration += timedelta(seconds = task.categorie.estimated_time)
                
            except Task.DoesNotExist:
                raise serializers.ValidationError({'task_ids': f'Tarefa {task_id} não cadastrada.'})
        
        operation = Operation.objects.create(
            begin = base_time,
            end = base_time + total_duration,
            **validated_data
        )

        for task in tasks:
            print(f"Associando operação {operation.id} com tarefa {task.id}")
            OperationTask.objects.get_or_create(operation = operation, task = task)

        return operation