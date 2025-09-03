from django.db import models
from teams.models import Team
from tasks.models import Task
import logging

# Configurar logger
logger = logging.getLogger(__name__)


class TeamTask(models.Model):
    team = models.ForeignKey(
        Team, 
        on_delete=models.CASCADE,
        related_name='team_tasks',
        verbose_name='Equipe'
    )
    task = models.ForeignKey(
        Task, 
        on_delete=models.CASCADE,
        related_name='team_tasks',
        verbose_name='Tarefa'
    )
    begin = models.DateTimeField(
        verbose_name='Início da execução'
    )
    end = models.DateTimeField(
        verbose_name='Fim da execução'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'team_task'
        verbose_name = 'Equipe Tarefa'
        verbose_name_plural = 'Equipes Tarefas'
        unique_together = ['team', 'task']

    def __str__(self):
        if self.team and self.task:
            return f"Equipe {self.team.name} - Tarefa {self.task.id}"
        return f"TeamTask #{self.id}"

    def save(self, *args, **kwargs):
        """Log detalhado antes de salvar"""
        if self.pk:  # Atualização
            logger.info(f"🔄 Atualizando TeamTask ID {self.pk}: Equipe {self.team.name if self.team else 'None'} - Tarefa {self.task.id if self.task else 'None'}")
            logger.info(f"   📅 Horários: {self.begin} -> {self.end}")
        else:  # Criação
            logger.info(f"🆕 Criando novo TeamTask: Equipe {self.team.name if self.team else 'None'} - Tarefa {self.task.id if self.task else 'None'}")
            logger.info(f"   📅 Horários: {self.begin} -> {self.end}")
            logger.info(f"   ⏱️ Duração: {(self.end - self.begin).total_seconds() / 3600:.2f} horas" if self.begin and self.end else "   ⚠️ Horários não definidos")
        
        # Validações com logs
        if self.begin and self.end:
            if self.begin >= self.end:
                logger.error(f"❌ VALIDAÇÃO FALHOU: begin ({self.begin}) deve ser menor que end ({self.end})")
                raise ValueError("begin deve ser menor que end")
            else:
                logger.info(f"✅ Validação de horários: OK")
        
        if not self.team:
            logger.error(f"❌ VALIDAÇÃO FALHOU: Equipe não pode ser nula")
            raise ValueError("Equipe é obrigatória")
        
        if not self.task:
            logger.error(f"❌ VALIDAÇÃO FALHOU: Tarefa não pode ser nula")
            raise ValueError("Tarefa é obrigatória")
        
        # Salvar
        super().save(*args, **kwargs)
        logger.info(f"💾 TeamTask salvo com sucesso: ID {self.pk}")

    def delete(self, *args, **kwargs):
        """Log antes de deletar"""
        logger.warning(f"🗑️ Deletando TeamTask ID {self.pk}: Equipe {self.team.name if self.team else 'None'} - Tarefa {self.task.id if self.task else 'None'}")
        
        # 🔧 CORREÇÃO: NÃO liberar equipe automaticamente ao deletar TeamTask
        # A equipe só deve ser liberada quando TODAS as suas tarefas estiverem finalizadas
        logger.info(f"   ℹ️ Equipe {self.team.name} NÃO liberada automaticamente")
        logger.info(f"   ℹ️ Verificar se todas as tarefas da equipe estão finalizadas antes de liberar")
        
        super().delete(*args, **kwargs)
        logger.info(f"✅ TeamTask ID {self.pk} deletado com sucesso")