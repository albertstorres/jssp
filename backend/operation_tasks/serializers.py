from rest_framework import serializers
from operation_tasks.models import OperationTasks


class OperationTasksSerializer(serializers.ModelSerializer):


    class Meta:
        model = OperationTasks
        fields = '__all__'