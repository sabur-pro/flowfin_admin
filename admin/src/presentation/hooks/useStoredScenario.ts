'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  defaultScenario,
  parseScenario,
  type Scenario,
} from '@/domain/unit-economics';

/** Версия в ключе: меняется модель — прошлые настройки просто не читаются. */
const STORAGE_KEY = 'flowfin.unit-economics.scenario.v2';

/**
 * Дефолт вычисляется один раз: useSyncExternalStore сравнивает снимки по
 * ссылке и зациклился бы на новом объекте при каждом рендере.
 */
const DEFAULT_SCENARIO = defaultScenario('uae', 'usa', 'pro');

let snapshot: Scenario | null = null;
const listeners = new Set<() => void>();

/**
 * Сценарий живёт в localStorage, а React читает его как внешнее хранилище.
 * На сервере localStorage нет, поэтому серверный снимок — всегда дефолт;
 * после гидратации React сам перечитает клиентский и перерисует экран.
 */
export function useStoredScenario() {
  const scenario = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setScenario = useCallback(
    (next: Scenario | ((current: Scenario) => Scenario)) => {
      const value =
        typeof next === 'function' ? next(getSnapshot()) : next;
      snapshot = value;
      write(value);
      emit();
    },
    [],
  );

  const reset = useCallback(() => {
    forget();
    snapshot = DEFAULT_SCENARIO;
    emit();
  }, []);

  return { scenario, setScenario, reset };
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Соседняя вкладка с той же админкой не должна показывать устаревший сценарий.
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot(): Scenario {
  snapshot ??= read() ?? DEFAULT_SCENARIO;
  return snapshot;
}

function getServerSnapshot(): Scenario {
  return DEFAULT_SCENARIO;
}

function onStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  snapshot = read() ?? DEFAULT_SCENARIO;
  emit();
}

function emit(): void {
  for (const listener of listeners) listener();
}

/**
 * Любая проблема с хранилищем — это не повод ронять страницу: приватный режим
 * запрещает запись, а чужая запись по тому же ключу может оказаться мусором.
 */
function read(): Scenario | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? parseScenario(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function write(scenario: Scenario): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario));
  } catch {
    // Квота или запрет записи: сценарий просто не переживёт перезагрузку.
  }
}

function forget(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Нечего чистить — и ладно.
  }
}
