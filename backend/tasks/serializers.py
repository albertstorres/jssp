from rest_framework import serializers

from tasks.models import Task


class TaskListSerializer(serializers.ModelSerializer):
    """Serializer para listagem de tarefas - retorna apenas campos obrigatórios"""
    categorie = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ['id', 'status', 'created_at', 'finished_at', 'categorie']

    def get_categorie(self, obj):
        """Retorna o ID da categoria (campo obrigatório para o frontend)"""
        return obj.category.id if obj.category else None


class TaskSerializer(serializers.ModelSerializer):
    categorie = serializers.SerializerMethodField()  # Campo obrigatório para o frontend

    class Meta:
        model = Task
        fields = ['id', 'status', 'created_at', 'finished_at', 'categorie']
        read_only_fields = ['finished_at']

    def get_categorie(self, obj):
        """Retorna o ID da categoria (campo obrigatório para o frontend)"""
        return obj.category.id if obj.category else None