from django.contrib import admin
from operations.models import Operation


@admin.register(Operation)
class OperationAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'begin', 'end', 'timespan', 'finalized', 'created_at']
    list_filter = ['finalized', 'begin', 'end', 'created_at']
    search_fields = ['name']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('name', 'finalized')
        }),
        ('Horários', {
            'fields': ('begin', 'end', 'timespan')
        }),
        ('Sistema', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
