from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('api/v1/', include('authetication.urls')),
    path('api/v1/', include('categories.urls')),
    path('api/v1/', include('operation_tasks.urls')),
    path('api/v1/', include('operations.urls')),
    path('api/v1/', include('operators.urls')),
    path('api/v1/', include('tasks.urls')),
    path('api/v1/', include('teams.urls')),
    path('api/v1/', include('workers.urls')),
    path('admin/', admin.site.urls),
]
