from rest_framework import viewsets
from categories.models import Categorie
from categories.serializers import CategorieSerializer


class CategorieViewSet(viewsets.ModelViewSet):
    queryset = Categorie.objects.all()
    serializer_class = CategorieSerializer