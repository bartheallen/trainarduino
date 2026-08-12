export type ModulePageErrorKind = 'auth' | 'invalid-id' | 'content-load-failed';

export interface ModulePageErrorState {
  kind: ModulePageErrorKind;
  title: string;
  detail: string;
}

export interface CreateModulePageErrorStateParams {
  user: { id: string } | null;
  id?: string;
  moduleId?: number;
  error?: Error | null;
}

export function createModulePageErrorState({
  user,
  id,
  moduleId,
  error,
}: CreateModulePageErrorStateParams): ModulePageErrorState | null {
  if (!user) {
    return {
      kind: 'auth',
      title: 'Connexion requise',
      detail: 'Vous devez être connecté pour ouvrir un module.',
    };
  }

  if (!id || Number.isNaN(Number(id))) {
    return {
      kind: 'invalid-id',
      title: 'Module introuvable',
      detail: `L’identifiant de module reçu est invalide : ${id ?? 'inconnu'}.`,
    };
  }

  if (moduleId !== undefined && Number.isNaN(moduleId)) {
    return {
      kind: 'invalid-id',
      title: 'Module introuvable',
      detail: `L’identifiant de module reçu est invalide : ${id}.`,
    };
  }

  if (error) {
    return {
      kind: 'content-load-failed',
      title: 'Impossible d’ouvrir ce module',
      detail: `Le contenu du module ${moduleId ?? id} n’a pas pu être chargé. ${error.message}`,
    };
  }

  return null;
}
