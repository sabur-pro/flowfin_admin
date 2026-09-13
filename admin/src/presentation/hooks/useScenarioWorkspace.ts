'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
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

/** Версия в ключе: меняется модель — прошлые настройки просто не читаются. */
const STORAGE_KEY = 'flowfin.unit-economics.workspace.v3';

/**
 * Дефолт вычисляется один раз: useSyncExternalStore сравнивает снимки по
 * ссылке и зациклился бы на новом объекте при каждом рендере.
 */
const DEFAULT_WORKSPACE = createWorkspace(defaultScenario('uae', 'usa', 'pro'));

let snapshot: Workspace | null = null;
const listeners = new Set<() => void>();

/**
 * Набор сценариев живёт в localStorage, а React читает его как внешнее
 * хранилище. На сервере localStorage нет, поэтому серверный снимок — всегда
 * дефолт; после гидратации React сам перечитает клиентский и перерисует экран.
 */
export function useScenarioWorkspace() {
  const workspace = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const scenario = activeScenario(workspace);

  const setScenario = useCallback(
    (next: Scenario | ((current: Scenario) => Scenario)) => {
      const current = getSnapshot();
      const value =
        typeof next === 'function' ? next(activeScenario(current)) : next;
      commit(updateActive(current, value));
    },
    [],
  );

  /** Переключение селектора: недостающие части цели берутся из активной. */
  const select = useCallback((target: Partial<ScenarioTarget>) => {
    const current = getSnapshot();
    const from = activeScenario(current);
    commit(
      switchTo(current, {
        jurisdictionId: target.jurisdictionId ?? from.jurisdictionId,
        marketId: target.marketId ?? from.marketId,
        planId: target.planId ?? from.planId,
      }),
    );
  }, []);

  const reset = useCallback(() => commit(resetActive(getSnapshot())), []);

  const resetAll = useCallback(() => {
    forget();
    snapshot = DEFAULT_WORKSPACE;
    emit();
  }, []);

  /** Сколько комбинаций уже настраивали — подсказка, что память работает. */
  const configuredCount = useMemo(
    () => Object.keys(workspace.scenarios).length,
    [workspace],
  );

  return { scenario, setScenario, select, reset, resetAll, configuredCount };
}

function commit(next: Workspace): void {
  snapshot = next;
  write(next);
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Соседняя вкладка с той же админкой не должна показывать устаревший набор.
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot(): Workspace {
  snapshot ??= read() ?? DEFAULT_WORKSPACE;
  return snapshot;
}

function getServerSnapshot(): Workspace {
  return DEFAULT_WORKSPACE;
}

function onStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  snapshot = read() ?? DEFAULT_WORKSPACE;
  emit();
}

function emit(): void {
  for (const listener of listeners) listener();
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
    // Квота или запрет записи: настройки просто не переживут перезагрузку.
  }
}

function forget(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Нечего чистить — и ладно.
  }
}
