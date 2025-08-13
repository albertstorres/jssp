from django.contrib import admin
from operation_team.models import OperationTeam


@admin.register(OperationTeam)
class OperationTeamAdmin(admin.ModelAdmin):
    list_display = ['operation', 'team', 'begin', 'end']
    list_filter = ['operation', 'team', 'begin', 'end']
    search_fields = ['operation__name', 'team__name']
    date_hierarchy = 'begin'
