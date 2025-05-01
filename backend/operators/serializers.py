from rest_framework import serializers
from operators.models import Operator
from django.contrib.auth.models import User


class OperatorSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True, max_length=100)
    password = serializers.CharField(write_only=True, style={'input_type':'password'})
    

    class Meta:
        model = Operator
        fields = ['id', 'username', 'password', 'user']
    
    def create(self, validated_data):
        username = validated_data.pop('username')
        password = validated_data.pop('password')

        try:
            User.objects.get(username=username)
            raise serializers.ValidationError('Usuário já cadastrado.')
        except User.DoesNotExist:
            user = User.objects.create_user(username=username, password=password)
            operator = Operator.objects.create(user=user)
            return operator