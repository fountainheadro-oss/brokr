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
  deleteDoc,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface Viewing {
  id?: string;
  propertyId: string;
  contactId: string;
  contactName: string;
  agentId?: string;
  agentName?: string;
  date: string;
  hour: string;
  createdAt: any;
  updatedAt: any;
}

const VIEWINGS_COLLECTION = 'viewings';

const cleanUndefined = (obj: any): any => {
  const result: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
};

export const viewingsService = {
  addViewing: async (viewingData: Omit<Viewing, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = serverTimestamp();
      const sanitized = cleanUndefined(viewingData);
      return await addDoc(collection(db, VIEWINGS_COLLECTION), {
        ...sanitized,
        createdAt: now,
        updatedAt: now
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, VIEWINGS_COLLECTION);
    }
  },

  subscribeToPropertyViewings: (propertyId: string, callback: (viewings: Viewing[]) => void) => {
    const q = query(
      collection(db, VIEWINGS_COLLECTION), 
      where('propertyId', '==', propertyId),
      orderBy('date', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const viewings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Viewing[];
      callback(viewings);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, VIEWINGS_COLLECTION);
    });
  },

  subscribeToAllViewings: (callback: (viewings: Viewing[]) => void) => {
    const q = query(
      collection(db, VIEWINGS_COLLECTION), 
      orderBy('date', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const viewings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Viewing[];
      callback(viewings);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, VIEWINGS_COLLECTION);
    });
  },

  deleteViewing: async (viewingId: string) => {
    const path = `${VIEWINGS_COLLECTION}/${viewingId}`;
    try {
      const viewingRef = doc(db, VIEWINGS_COLLECTION, viewingId);
      return await deleteDoc(viewingRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
