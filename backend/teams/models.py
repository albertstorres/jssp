from django.db import models


class Team(models.Model):
    shift = models.IntegerField(
        default=8,
        verbose_name='Turno',
    )
    name = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name='Nome',
    )
    is_ocupied = models.BooleanField(
        default = False,
        verbose_name = 'Está ocupado',
    )
    on_mount = models.BooleanField(
        default = False,
        verbose_name = 'Em montagem',
    )


    class Meta:
        verbose_name = 'Equipe'
        verbose_name_plural = 'Equipes'
    
    def __str__(self):
        return self.name
    
    def can_be_released(self):
        """
        Verifica se a equipe pode ser liberada (is_ocupied = False)
        Uma equipe só pode ser liberada quando TODAS as suas tarefas estão finalizadas
        """
        if not self.is_ocupied and not self.on_mount:
            return True, "Equipe já está livre"
        
        # Buscar todas as tarefas ativas da equipe
        from team_task.models import TeamTask
        active_team_tasks = TeamTask.objects.filter(
            team=self,
            task__status__in=['pending', 'in_progress']  # Tarefas não finalizadas
        )
        
        if active_team_tasks.exists():
            active_tasks = [f"Tarefa #{tt.task.id}" for tt in active_team_tasks]
            return False, f"Equipe tem {active_team_tasks.count()} tarefa(s) ativa(s): {', '.join(active_tasks)}"
        
        # Se não há tarefas ativas, a equipe pode ser liberada
        return True, "Todas as tarefas estão finalizadas"
    
    def release_if_possible(self):
        """
        Libera a equipe se todas as suas tarefas estiverem finalizadas
        Retorna (success, message)
        """
        can_release, message = self.can_be_released()
        
        if can_release and self.is_ocupied:
            self.is_ocupied = False
            self.save()
            return True, f"Equipe {self.name} liberada com sucesso: {message}"
        elif can_release and not self.is_ocupied:
            return True, f"Equipe {self.name} já estava livre: {message}"
        else:
            return False, f"Equipe {self.name} não pode ser liberada: {message}"
    
    def check_and_update_status(self):
        """
        Verifica o status atual da equipe e atualiza is_ocupied automaticamente
        Retorna (status_changed, old_status, new_status, message)
        """
        old_status = self.is_ocupied
        can_release, message = self.can_be_released()
        
        if can_release and self.is_ocupied:
            # Equipe pode ser liberada
            self.is_ocupied = False
            self.save()
            return True, old_status, False, f"Equipe {self.name} liberada automaticamente: {message}"
        elif not can_release and not self.is_ocupied:
            # Equipe deve estar ocupada mas não está
            self.is_ocupied = True
            self.save()
            return True, old_status, True, f"Equipe {self.name} marcada como ocupada automaticamente: {message}"
        else:
            # Status está correto
            return False, old_status, self.is_ocupied, f"Status da equipe {self.name} está correto: {message}"