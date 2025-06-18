from rest_framework import serializers
from equipment.models import Equipment
from equipment.models import DowntimePeriod


class EquipmentSerializer(serializers.ModelSerializer):


    class Meta:
        model = Equipment
        fields = '__all__'


class DowntimePeriodSerializer(serializers.ModelSerializer):


    class Meta:
        model = DowntimePeriod
        fields = '__all__'