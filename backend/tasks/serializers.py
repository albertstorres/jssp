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
        fields = ['id', 'status', 'created_at', 'finished_at', 'categorie', 'category']
        read_only_fields = ['finished_at']

    def get_categorie(self, obj):
        """Retorna o ID da categoria (campo obrigatório para o frontend)"""
        return obj.category.id if obj.category else None

    def validate(self, attrs):
        """Validação personalizada para garantir que a categoria seja obrigatória apenas na criação"""
        import logging
        logger = logging.getLogger(__name__)
        
        # Se é uma atualização (PATCH/PUT), não exigir categoria se não foi fornecida
        if self.instance is not None:
            # Atualização: se categoria não foi fornecida, manter a existente
            if 'category' not in attrs:
                logger.info(f"Atualização de tarefa {self.instance.id}: mantendo categoria existente {self.instance.category.id if self.instance.category else 'None'}")
                attrs['category'] = self.instance.category
            else:
                logger.info(f"Atualização de tarefa {self.instance.id}: nova categoria {attrs['category'].id if attrs['category'] else 'None'}")
        else:
            # Criação: categoria é obrigatória
            if not attrs.get('category'):
                logger.error("Tentativa de criar tarefa sem categoria")
                raise serializers.ValidationError({'category': 'Categoria é obrigatória para criar uma tarefa.'})
            else:
                logger.info(f"Criação de nova tarefa com categoria {attrs['category'].id}")
        return attrs