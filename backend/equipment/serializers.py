from rest_framework import serializers
from equipment.models import Equipment, DowntimePeriod
from django.utils import timezone
from datetime import timedelta


class EquipmentSerializer(serializers.ModelSerializer):
    # Tempo de inatividade (em segundos) fornecido pela requisição
    downtime_seconds = serializers.IntegerField(write_only=True, required=True)

    class Meta:
        model = Equipment
        fields = ['id', 'name', 'is_ocupied', 'downtime_seconds']  # ← Corrigido aqui
        read_only_fields = ['is_ocupied']  # ← Garante que is_ocupied só aparece na leitura, não no POST/PUT

    def create(self, validated_data):
        downtime_seconds = validated_data.pop('downtime_seconds')

        # Cria equipamento com is_ocupied sempre False por padrão
        equipment = Equipment.objects.create(is_ocupied=False, **validated_data)

        self._create_downtime_period(equipment, downtime_seconds)

        return equipment

    def update(self, instance, validated_data):
        downtime_seconds = validated_data.pop('downtime_seconds', None)

        # Atualiza campos normais (exceto is_ocupied)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        # Se downtime_seconds for enviado, cria novo período de inatividade
        if downtime_seconds is not None:
            self._create_downtime_period(instance, downtime_seconds)

        return instance

    def _create_downtime_period(self, equipment, seconds: int):
        start_time = timezone.now()
        end_time = start_time + timedelta(seconds=seconds)

        DowntimePeriod.objects.create(
            equipment=equipment,
            start_time=start_time,
            end_time=end_time
        )