from rest_framework import serializers
from equipment_task.models import EquipmentTask


class EquipmentTaskSerializer(serializers.ModelSerializer):


    class Meta:
        model = EquipmentTask
        fields = '__all__'