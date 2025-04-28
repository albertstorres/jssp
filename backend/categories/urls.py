from django.urls import path, include
from rest_framework.routers import DefaultRouter
from categories.views import CategorieViewSet

router = DefaultRouter()

router.register('categories', CategorieViewSet)

urlpatterns = [
    path('', include(router.urls)),
]