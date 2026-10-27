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
import { entityIdService } from './entityIdService';

export type DocumentType = 
  | 'Contract'
  | 'Act Proprietate'
  | 'Cadastru & Intabulare'
  | 'Releveu'
  | 'Certificat Energetic'
  | 'Carte Identitate'
  | 'Procură'
  | 'Acord GDPR'
  | 'Proces Verbal'
  | 'Altele';

export interface DocumentItem {
  id?: string;
  documentId?: string; // e.g. D01, D02, D1029
  title: string;
  type: DocumentType;
  propertyId?: string;
  clientId?: string;
  staffId?: string;
  fileUrl?: string;
  fileName?: string;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

const DOCUMENTS_COLLECTION = 'documents';

export const documentService = {
  addDocument: async (data: Omit<DocumentItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const documentId = data.documentId || (await entityIdService.getNextId('document'));
      const now = serverTimestamp();
      return await addDoc(collection(db, DOCUMENTS_COLLECTION), {
        ...data,
        documentId,
        createdAt: now,
        updatedAt: now
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, DOCUMENTS_COLLECTION);
    }
  },

  updateDocument: async (id: string, data: Partial<DocumentItem>) => {
    const path = `${DOCUMENTS_COLLECTION}/${id}`;
    try {
      const docRef = doc(db, DOCUMENTS_COLLECTION, id);
      return await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  deleteDocument: async (id: string) => {
    const path = `${DOCUMENTS_COLLECTION}/${id}`;
    try {
      const docRef = doc(db, DOCUMENTS_COLLECTION, id);
      return await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  getDocument: async (id: string) => {
    const path = `${DOCUMENTS_COLLECTION}/${id}`;
    try {
      const docRef = doc(db, DOCUMENTS_COLLECTION, id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as DocumentItem;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  subscribeToDocuments: (callback: (docs: DocumentItem[]) => void) => {
    const q = query(collection(db, DOCUMENTS_COLLECTION), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const documents = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as DocumentItem[];
      callback(documents);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, DOCUMENTS_COLLECTION);
    });
  },

  subscribeToPropertyDocuments: (propertyId: string, callback: (docs: DocumentItem[]) => void) => {
    const q = query(
      collection(db, DOCUMENTS_COLLECTION),
      where('propertyId', '==', propertyId),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const documents = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as DocumentItem[];
      callback(documents);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, DOCUMENTS_COLLECTION);
    });
  }
};
