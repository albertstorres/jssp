from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from categories.models import Categorie
from categories.serializers import CategorieSerializer
from categories.filters import CategorieFilterClass


class CategorieViewSet(viewsets.ModelViewSet):
    queryset = Categorie.objects.all()
    serializer_class = CategorieSerializer
    rql_filter_class = CategorieFilterClass
    permission_classes = [IsAuthenticated]