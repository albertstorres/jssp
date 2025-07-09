from rest_framework import serializers
from workers.models import Worker
from django.contrib.auth.models import User, Group


class WorkerSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)
    team = serializers.PrimaryKeyRelatedField(queryset=Worker._meta.get_field('team').remote_field.model.objects.all(), required=False)

    class Meta:
        model = Worker
        fields = ['id', 'first_name', 'last_name', 'email', 'password', 'team']

    def create(self, validated_data):
        username = validated_data.pop('email')
        password = validated_data.pop('password')

        user = User.objects.create_user(
            username=username,
            password=password,
            is_staff=False
        )

        try:
            workers_group = Group.objects.get(name='workers')
            user.groups.add(workers_group)
        except Group.DoesNotExist:
            raise serializers.ValidationError('Grupo "workers" não encontrado.')

        worker = Worker.objects.create(user=user, **validated_data)
        return worker

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Adiciona os campos do user
        representation['email'] = instance.user.username
        return representation