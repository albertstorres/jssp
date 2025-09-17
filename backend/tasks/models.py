from django.db import models
from categories.models import Category
import logging

logger = logging.getLogger(__name__)


class Task(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('in_progress', 'Em andamento'),
        ('finished', 'Finalizada'),
    ]
    status = models.CharField(
        max_length = 50,
        choices = STATUS_CHOICES,
        default = 'pending',
        verbose_name = 'Status',
    )
    on_mount = models.BooleanField(
        default = False,
        verbose_name = 'Em montagem',
    )
    category = models.ForeignKey(
        Category,
        on_delete = models.PROTECT,
        null = True,
        blank = True,
        related_name = 'Categories',
        verbose_name = 'Categoria',
    )
    created_at = models.DateTimeField(
        auto_now_add = True,
        null = True,
        verbose_name = 'Criado em',
    )
    finished_at = models.DateTimeField(
        blank = True,
        null = True,
        verbose_name = 'Finalizado em',
    )


    class Meta:
        verbose_name = 'Tarefa'
        verbose_name_plural = 'Tarefas'

    def __str__(self):
        return str(self.id)

    def save(self, *args, **kwargs):
        """Override para adicionar logs e verificar liberação de equipes"""
        is_new = self.pk is None
        
        if is_new:
            logger.info(f"🆕 Criando nova tarefa: ID {self.id}, Status: {self.status}")
        else:
            old_instance = Task.objects.get(pk=self.pk)
            old_status = old_instance.status
            new_status = self.status
            
            if old_status != new_status:
                logger.info(f"🔄 Status da tarefa {self.id} alterado: {old_status} -> {new_status}")
                
                # 🔧 CORREÇÃO: Verificar se equipes podem ser liberadas quando tarefa é finalizada
                if new_status == 'finished':
                    logger.info(f"   🏁 Tarefa {self.id} finalizada, verificando se equipes podem ser liberadas...")
                    
                    # Buscar todas as equipes associadas a esta tarefa
                    from team_task.models import TeamTask
                    team_tasks = TeamTask.objects.filter(task=self)
                    
                    for team_task in team_tasks:
                        team = team_task.team
                        logger.info(f"      🔍 Verificando equipe {team.name}...")
                        
                        # Verificar se a equipe pode ser liberada
                        can_release, message = team.can_be_released()
                        logger.info(f"         {message}")
                        
                        if can_release and team.is_ocupied:
                            # Liberar equipe automaticamente
                            success, release_message = team.release_if_possible()
                            if success:
                                logger.info(f"         ✅ {release_message}")
                            else:
                                logger.warning(f"         ⚠️ {release_message}")
                        else:
                            logger.info(f"         ℹ️ Equipe {team.name} não pode ser liberada ainda")
        
        super().save(*args, **kwargs)
        
        if is_new:
            logger.info(f"✅ Tarefa criada com sucesso: ID {self.id}")
        else:
            logger.info(f"✅ Tarefa atualizada com sucesso: ID {self.id}")