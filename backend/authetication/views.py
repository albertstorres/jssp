from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from workers.models import Worker


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        try:
            worker = Worker.objects.get(user=user)
            token['team_id'] = worker.team.id if worker.team else None
        except Worker.DoesNotExist:
            token['team_id'] = None
        
        token['groups'] = list(user.groups.values_list('name', flat=True))

        return token

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer