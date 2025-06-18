from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger_ui'),
    path('api/v1/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('api/v1/', include('authetication.urls')),
    path('api/v1/', include('categories.urls')),
    path('api/v1/', include('equipment.urls')),
    path('api/v1/', include('operations.urls')),
    path('api/v1/', include('operators.urls')),
    path('api/v1/', include('tasks.urls')),
    path('api/v1/', include('teams.urls')),
    path('api/v1/', include('workers.urls')),
    path('admin/', admin.site.urls),
]