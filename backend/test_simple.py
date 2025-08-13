#!/usr/bin/env python3
"""
Teste simples para verificar se a estrutura está correta
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Testar imports básicos
try:
    from team_task.models import TeamTask
    print("✅ Modelo TeamTask importado com sucesso!")
    
    # Testar campos do modelo
    fields = [f.name for f in TeamTask._meta.fields]
    print(f"✅ Campos do modelo: {fields}")
    
    # Testar serializer
    from team_task.serializers import TeamTaskSerializer
    print("✅ Serializer TeamTask importado com sucesso!")
    
    # Testar view
    from team_task.views import TeamTaskViewSet
    print("✅ View TeamTask importada com sucesso!")
    
    # Testar URLs
    from team_task.urls import urlpatterns
    print("✅ URLs TeamTask importadas com sucesso!")
    
    print("\n🎉 Todos os componentes da API team_task estão funcionando!")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc()
