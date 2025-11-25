'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(null);

  useEffect(() => {
    // Verificar se Firebase está configurado
    if (!auth) {
      setFirebaseError('Firebase não está configurado. Por favor, configure as variáveis de ambiente.');
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          });
        } else {
          setUser(null);
        }
        setLoading(false);
        setFirebaseError(null);
      }, (error) => {
        console.error('Erro no Firebase Auth:', error);
        setFirebaseError(error.message);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Erro ao configurar Firebase Auth:', error);
      setFirebaseError(error.message);
      setLoading(false);
    }
  }, []);

  const signIn = async (email, password) => {
    if (!auth) {
      return { success: false, error: 'Firebase não está configurado' };
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.code || error.message };
    }
  };

  const signUp = async (email, password) => {
    if (!auth) {
      return { success: false, error: 'Firebase não está configurado' };
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.code || error.message };
    }
  };

  const logout = async () => {
    if (!auth) {
      return { success: false, error: 'Firebase não está configurado' };
    }
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (email) => {
    if (!auth) {
      return { success: false, error: 'Firebase não está configurado' };
    }
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.code || error.message };
    }
  };

  const signInWithGoogle = async () => {
    if (!auth) {
      return { success: false, error: 'Firebase não está configurado' };
    }
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.code || error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      firebaseError,
      signIn, 
      signUp, 
      logout, 
      resetPassword,
      signInWithGoogle 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

