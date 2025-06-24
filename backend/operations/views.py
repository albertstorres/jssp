from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from operations.serializers import OperationListSerializer, OperationCreateSerializer
from operations.models import Operation

class OperationViewSet(viewsets.ModelViewSet):
    queryset = Operation.objects.all()
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Operation.objects.all()
        finalized_param = self.request.query_params.get('finalized')

        if finalized_param is not None:
            if finalized_param.lower() == 'true':
                queryset = queryset.filter(finalized=True)
            elif finalized_param.lower() == 'false':
                queryset = queryset.filter(finalized=False)

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return OperationCreateSerializer
        return OperationListSerializer