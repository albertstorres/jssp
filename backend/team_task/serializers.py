from rest_framework import serializers
from team_task.models import TeamTask


class TeamTaskSerializer(serializers.ModelSerializer):
    task_id = serializers.SerializerMethodField()
    task_status = serializers.SerializerMethodField()
    

    class Meta:
        model = TeamTask
        fields = ['id', 'team', 'task', 'task_id', 'task_status']
    
    def get_task_id(self, obj):
        if obj.task:
            return obj.task.id
        return None
    
    def get_task_status(self, obj):
        if obj.task:
            return obj.task.status
        return None