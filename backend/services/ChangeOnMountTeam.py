from typing import Iterable, List, Union, Tuple
import logging

from teams.models import Team


logger = logging.getLogger(__name__)


def _normalize_ids(team_ids: Union[int, Iterable[int]]) -> List[int]:
    if isinstance(team_ids, int):
        return [team_ids]
    if team_ids is None:
        return []
    return [int(x) for x in team_ids]


def change_on_mount_team(team_ids: Union[int, Iterable[int]]) -> Tuple[int, List[int]]:
    """
    Define on_mount=False para uma equipe ou conjunto de equipes.

    Parâmetros:
        team_ids: int ou iterável de ints com os IDs de Team.

    Retorno:
        (updated_count, updated_ids)
    """
    ids = _normalize_ids(team_ids)

    if not ids:
        logger.info("change_on_mount_team chamado sem IDs. Nada a atualizar.")
        return 0, []

    logger.info(f"change_on_mount_team - Atualizando on_mount=False para equipes: {ids}")

    # Filtra apenas os que estão atualmente com on_mount=True para evitar writes desnecessários
    qs = Team.objects.filter(id__in=ids, on_mount=True)
    updated_count = qs.update(on_mount=False)

    logger.info(f"change_on_mount_team - Total atualizado: {updated_count}")

    # Recupera os IDs efetivamente atualizados
    updated_ids = list(Team.objects.filter(id__in=ids, on_mount=False).values_list('id', flat=True))
    return updated_count, updated_ids


