from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from operators.serializers import OperatorSerializer
from operators.models import Operator
from operators.filters import OperatorFilterClass


class OperatorViewSet(viewsets.ModelViewSet):
    queryset = Operator.objects.all()
    serializer_class = OperatorSerializer
    rql_filter_class = OperatorFilterClass
    permission_classes = [IsAuthenticated]