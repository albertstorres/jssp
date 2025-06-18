from rest_framework import serializers
from operation_task.models import OperationTask


class OperationTaskSerializer(serializers.ModelSerializer):


    class Meta:
        model = OperationTask
        fields = '__all__'