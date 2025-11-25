import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Utilitários para interagir com o Firestore
 * Estrutura: users/{userId}/workoutPlans/{planId}
 *           users/{userId}/workoutHistory/{recordId}
 */

// Referências às coleções do usuário
export const getUserWorkoutPlansRef = (userId) => 
  collection(db, `users/${userId}/workoutPlans`);

export const getUserWorkoutHistoryRef = (userId) => 
  collection(db, `users/${userId}/workoutHistory`);

// Obter documento específico
export const getWorkoutPlanDoc = (userId, planId) => 
  doc(db, `users/${userId}/workoutPlans/${planId}`);

export const getWorkoutHistoryDoc = (userId, recordId) => 
  doc(db, `users/${userId}/workoutHistory/${recordId}`);

/**
 * Carregar todos os planos de treino do usuário
 */
export const loadWorkoutPlans = async (userId) => {
  try {
    const plansRef = getUserWorkoutPlansRef(userId);
    const snapshot = await getDocs(plansRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao carregar planos:', error);
    throw error;
  }
};

/**
 * Carregar todo o histórico de treinos do usuário
 */
export const loadWorkoutHistory = async (userId) => {
  try {
    const historyRef = getUserWorkoutHistoryRef(userId);
    const snapshot = await getDocs(historyRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    throw error;
  }
};

/**
 * Salvar um plano de treino
 */
export const saveWorkoutPlan = async (userId, plan) => {
  try {
    const planRef = getWorkoutPlanDoc(userId, plan.id.toString());
    await setDoc(planRef, {
      ...plan,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Erro ao salvar plano:', error);
    throw error;
  }
};

/**
 * Salvar um registro de histórico
 */
export const saveWorkoutHistory = async (userId, record) => {
  try {
    const recordRef = getWorkoutHistoryDoc(userId, record.id.toString());
    await setDoc(recordRef, {
      ...record,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Erro ao salvar histórico:', error);
    throw error;
  }
};

/**
 * Deletar um plano de treino
 */
export const deleteWorkoutPlan = async (userId, planId) => {
  try {
    const planRef = getWorkoutPlanDoc(userId, planId.toString());
    await deleteDoc(planRef);
    return true;
  } catch (error) {
    console.error('Erro ao deletar plano:', error);
    throw error;
  }
};

/**
 * Deletar um registro de histórico
 */
export const deleteWorkoutHistory = async (userId, recordId) => {
  try {
    const recordRef = getWorkoutHistoryDoc(userId, recordId.toString());
    await deleteDoc(recordRef);
    return true;
  } catch (error) {
    console.error('Erro ao deletar histórico:', error);
    throw error;
  }
};

/**
 * Sincronizar todos os dados de uma vez (upload inicial)
 */
export const syncAllData = async (userId, workoutPlans, history) => {
  try {
    const batch = writeBatch(db);
    
    // Adicionar todos os planos ao batch
    workoutPlans.forEach(plan => {
      const planRef = getWorkoutPlanDoc(userId, plan.id.toString());
      batch.set(planRef, {
        ...plan,
        createdAt: plan.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    // Adicionar todo o histórico ao batch
    history.forEach(record => {
      const recordRef = getWorkoutHistoryDoc(userId, record.id.toString());
      batch.set(recordRef, {
        ...record,
        createdAt: record.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Erro ao sincronizar todos os dados:', error);
    throw error;
  }
};

/**
 * Configurar listener em tempo real para planos
 */
export const subscribeToWorkoutPlans = (userId, callback) => {
  const plansRef = getUserWorkoutPlansRef(userId);
  return onSnapshot(plansRef, (snapshot) => {
    const plans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(plans);
  }, (error) => {
    console.error('Erro no listener de planos:', error);
    callback(null, error);
  });
};

/**
 * Configurar listener em tempo real para histórico
 */
export const subscribeToWorkoutHistory = (userId, callback) => {
  const historyRef = getUserWorkoutHistoryRef(userId);
  return onSnapshot(historyRef, (snapshot) => {
    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(history);
  }, (error) => {
    console.error('Erro no listener de histórico:', error);
    callback(null, error);
  });
};

