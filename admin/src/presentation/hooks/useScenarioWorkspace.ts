'use client';

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import {
  activeScenario,
  createWorkspace,
  defaultScenario,
  parseWorkspace,
  resetActive,
  switchTo,
  updateActive,
  type Scenario,
  type ScenarioTarget,
  type Workspace,
} from '@/domain/unit-economics';

/** Версия в ключе: меняется модель — прошлый черновик просто не читается. */
const STORAGE_KEY = 'flowfin.unit-economics.workspace.v3';

/** Заводские ориентиры — когда на сервере пусто и в браузере пусто. */
export const FACTORY_WORKSPACE = createWorkspace(
  defaultScenario('uae', 'usa', 'pro'),
);

/**
 * Набор сценариев как внешнее хранилище React.
 *
 * Три источника в порядке убывания старшинства: черновик этого браузера
 * (localStorage), общая версия с сервера и заводские ориентиры. Черновик
 * старше серверного намеренно — человек не должен терять несохранённую работу
 * из-за того, что кто-то другой нажал «Сохранить»; о расхождении ему скажет
 * подпись у кнопки.
 */
export function useScenarioWorkspace(serverWorkspace: Workspace | null) {
  // Стор создаётся один раз на монтирование: useSyncExternalStore требует
  // стабильных subscribe и getSnapshot, иначе он переподписывается на каждый
  // рендер. Серверный набор — часть начального состояния, а не эффект.
  const [store] = useState(() =>
    createStore(serverWorkspace ?? FACTORY_WORKSPACE),
  );

  const workspace = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const scenario = activeScenario(workspace);

  const setScenario = useCallback(
    (next: Scenario | ((current: Scenario) => Scenario)) => {
      const current = store.getSnapshot();
      const value =
        typeof next === 'function' ? next(activeScenario(current)) : next;
      store.commit(updateActive(current, value));
    },
    [store],
  );

  /** Переключение селектора: недостающие части цели берутся из активной. */
  const select = useCallback(
    (target: Partial<ScenarioTarget>) => {
      const current = store.getSnapshot();
      const from = activeScenario(current);
      store.commit(
        switchTo(current, {
          jurisdictionId: target.jurisdictionId ?? from.jurisdictionId,
          marketId: target.marketId ?? from.marketId,
          planId: target.planId ?? from.planId,
        }),
      );
    },
    [store],
  );

  const reset = useCallback(
    () => store.commit(resetActive(store.getSnapshot())),
    [store],
  );

  /** Откат к тому, что лежит на сервере (или к заводскому, если там пусто). */
  const revertTo = useCallback(
    (baseline: Workspace) => store.commit(baseline),
    [store],
  );

  /** Сколько комбинаций уже настраивали — подсказка, что память работает. */
  const configuredCount = useMemo(
    () => Object.keys(workspace.scenarios).length,
    [workspace],
  );

  return {
    workspace,
    scenario,
    setScenario,
    select,
    reset,
    revertTo,
    configuredCount,
  };
}

interface WorkspaceStore {
  readonly subscribe: (listener: () => void) => () => void;
  readonly getSnapshot: () => Workspace;
  readonly getServerSnapshot: () => Workspace;
  readonly commit: (next: Workspace) => void;
}

function createStore(initial: Workspace): WorkspaceStore {
  const listeners = new Set<() => void>();
  let snapshot: Workspace | null = null;

  const emit = () => {
    for (const listener of listeners) listener();
  };

  const getSnapshot = (): Workspace => {
    // На сервере localStorage нет, поэтому первый снимок там — серверный набор;
    // после гидратации React перечитает клиентский и перерисует экран сам.
    snapshot ??= read() ?? initial;
    return snapshot;
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    snapshot = read() ?? initial;
    emit();
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      // Соседняя вкладка с той же админкой не должна показывать старый набор.
      window.addEventListener('storage', onStorage);

      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          window.removeEventListener('storage', onStorage);
        }
      };
    },
    getSnapshot,
    getServerSnapshot: () => initial,
    commit(next) {
      snapshot = next;
      write(next);
      emit();
    },
  };
}

/**
 * Любая проблема с хранилищем — это не повод ронять страницу: приватный режим
 * запрещает запись, а чужая запись по тому же ключу может оказаться мусором.
 */
function read(): Workspace | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? parseWorkspace(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function write(workspace: Workspace): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  } catch {
    // Квота или запрет записи: черновик просто не переживёт перезагрузку.
  }
}
