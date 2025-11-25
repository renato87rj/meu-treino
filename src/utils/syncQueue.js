/**
 * Sistema de fila de sincronização para operações offline
 * Armazena operações pendentes no localStorage e processa quando online
 */

const SYNC_QUEUE_KEY = 'syncQueue';
const MAX_RETRIES = 3;

/**
 * Tipos de operações suportadas
 */
export const SYNC_OPERATIONS = {
  CREATE_PLAN: 'CREATE_PLAN',
  UPDATE_PLAN: 'UPDATE_PLAN',
  DELETE_PLAN: 'DELETE_PLAN',
  CREATE_HISTORY: 'CREATE_HISTORY',
  DELETE_HISTORY: 'DELETE_HISTORY'
};

/**
 * Obter fila de sincronização do localStorage
 */
export const getSyncQueue = () => {
  try {
    const queue = localStorage.getItem(SYNC_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('Erro ao ler fila de sincronização:', error);
    return [];
  }
};

/**
 * Salvar fila de sincronização no localStorage
 */
export const saveSyncQueue = (queue) => {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    return true;
  } catch (error) {
    console.error('Erro ao salvar fila de sincronização:', error);
    return false;
  }
};

/**
 * Adicionar operação à fila
 */
export const addToSyncQueue = (operation, data) => {
  const queue = getSyncQueue();
  const queueItem = {
    id: Date.now() + Math.random(),
    operation,
    data,
    timestamp: new Date().toISOString(),
    retries: 0
  };
  
  queue.push(queueItem);
  saveSyncQueue(queue);
  return queueItem.id;
};

/**
 * Remover operação da fila após sucesso
 */
export const removeFromSyncQueue = (itemId) => {
  const queue = getSyncQueue();
  const filtered = queue.filter(item => item.id !== itemId);
  saveSyncQueue(filtered);
};

/**
 * Incrementar tentativas de uma operação
 */
export const incrementRetry = (itemId) => {
  const queue = getSyncQueue();
  const updated = queue.map(item => {
    if (item.id === itemId) {
      return { ...item, retries: item.retries + 1 };
    }
    return item;
  });
  saveSyncQueue(updated);
};

/**
 * Remover operações que excederam o limite de tentativas
 */
export const removeFailedOperations = () => {
  const queue = getSyncQueue();
  const filtered = queue.filter(item => item.retries < MAX_RETRIES);
  saveSyncQueue(filtered);
  return queue.length - filtered.length; // Retorna quantidade removida
};

/**
 * Limpar toda a fila
 */
export const clearSyncQueue = () => {
  localStorage.removeItem(SYNC_QUEUE_KEY);
};

/**
 * Obter operações pendentes
 */
export const getPendingOperations = () => {
  return getSyncQueue();
};

/**
 * Verificar se há operações pendentes
 */
export const hasPendingOperations = () => {
  const queue = getSyncQueue();
  return queue.length > 0;
};

