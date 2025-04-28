from rest_framework import serializers
from operations.models import Operation


class OpearionSerializer(serializers.ModelSerializer):


    class Meta:
        model = Operation
        fields = '__all__'