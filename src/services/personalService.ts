import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  getDoc,
  deleteDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { entityIdService } from './entityIdService';

export type PersonalStatus = 'Activ' | 'Inactiv';

export interface PersonalMember {
  id?: string;
  personalId?: string; // S1, S2, S1026...
  name: string;
  role: string;
  phone: string;
  email?: string;
  status: PersonalStatus;
  zone?: string;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

const PERSONAL_COLLECTION = 'personal';

export const personalService = {
  addPersonalMember: async (data: Omit<PersonalMember, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const personalId = data.personalId || (await entityIdService.getNextId('personal'));
      const now = serverTimestamp();
      return await addDoc(collection(db, PERSONAL_COLLECTION), {
        ...data,
        personalId,
        createdAt: now,
        updatedAt: now
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, PERSONAL_COLLECTION);
    }
  },

  updatePersonalMember: async (id: string, data: Partial<PersonalMember>) => {
    const path = `${PERSONAL_COLLECTION}/${id}`;
    try {
      const memberRef = doc(db, PERSONAL_COLLECTION, id);
      return await updateDoc(memberRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  deletePersonalMember: async (id: string) => {
    const path = `${PERSONAL_COLLECTION}/${id}`;
    try {
      const memberRef = doc(db, PERSONAL_COLLECTION, id);
      return await deleteDoc(memberRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  getPersonalMember: async (id: string) => {
    const path = `${PERSONAL_COLLECTION}/${id}`;
    try {
      const memberRef = doc(db, PERSONAL_COLLECTION, id);
      const snap = await getDoc(memberRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as PersonalMember;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  subscribeToPersonal: (callback: (members: PersonalMember[]) => void) => {
    const q = query(collection(db, PERSONAL_COLLECTION), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PersonalMember[];
      callback(members);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, PERSONAL_COLLECTION);
    });
  }
};
