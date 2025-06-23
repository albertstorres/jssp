from rest_framework import serializers
from equipment_operation.models import EquipmentOperation

class EquipmentOperationSerializer(serializers.ModelSerializer):


    class Meta:
        model = EquipmentOperation
        fields = '__all__'