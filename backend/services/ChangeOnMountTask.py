from typing import Iterable, List, Union, Tuple
import logging

from tasks.models import Task


logger = logging.getLogger(__name__)


def _normalize_ids(task_ids: Union[int, Iterable[int]]) -> List[int]:
    if isinstance(task_ids, int):
        return [task_ids]
    if task_ids is None:
        return []
    return [int(x) for x in task_ids]


def change_on_mount_task(task_ids: Union[int, Iterable[int]]) -> Tuple[int, List[int]]:
    """
    Define on_mount=False para uma tarefa ou conjunto de tarefas.

    Parâmetros:
        task_ids: int ou iterável de ints com os IDs de Task.

    Retorno:
        (updated_count, updated_ids)
    """
    ids = _normalize_ids(task_ids)

    if not ids:
        logger.info("change_on_mount_task chamado sem IDs. Nada a atualizar.")
        return 0, []

    logger.info(f"change_on_mount_task - Atualizando on_mount=False para tarefas: {ids}")

    # Filtra apenas os que estão atualmente com on_mount=True para evitar writes desnecessários
    qs = Task.objects.filter(id__in=ids, on_mount=True)
    updated_count = qs.update(on_mount=False)

    logger.info(f"change_on_mount_task - Total atualizado: {updated_count}")

    # Recupera os IDs efetivamente atualizados
    updated_ids = list(Task.objects.filter(id__in=ids, on_mount=False).values_list('id', flat=True))
    return updated_count, updated_ids


