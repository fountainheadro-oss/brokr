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
  getDocs
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ExtractionResult } from './geminiService';

export type LeadStatus = 'Nevalidata' | 'Calificata' | 'Activa' | 'AreInteres' | 'InNegociere' | 'Finalizata' | 'Arhiva' | 'Sterse';

export const mapStatus = (status: string): LeadStatus => {
  if (status === 'Lead-uri' || status === 'Intrata') return 'Nevalidata';
  if (status === 'Prospectare') return 'Calificata';
  if (status === 'Publicare') return 'Activa';
  if (status === 'Cerere') return 'AreInteres';
  if (status === 'Vizionare') return 'InNegociere';
  if (status === 'Semnare') return 'Finalizata';
  return status as LeadStatus;
};

export interface Lead {
  id?: string;
  propertyId?: string;
  url: string;
  title: string;
  zone: string;
  price: string;
  ownerName: string;
  ownerPhone: string;
  transactionType: "Vânzare" | "Închiriere";
  categoria: string;
  status: LeadStatus;
  coverImage?: string;
  notes?: string;
  extractedData?: ExtractionResult;
  createdAt: any; // Allow serverTimestamp
  updatedAt: any;
  lastMovedAt?: any;
}

const LEADS_COLLECTION = 'leads';

export const leadsService = {
  addLead: async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'lastMovedAt'>) => {
    try {
      const now = serverTimestamp();
      return await addDoc(collection(db, LEADS_COLLECTION), {
        ...leadData,
        createdAt: now,
        updatedAt: now,
        lastMovedAt: now
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, LEADS_COLLECTION);
    }
  },

  updateLeadStatus: async (leadId: string, newStatus: LeadStatus) => {
    const path = `${LEADS_COLLECTION}/${leadId}`;
    try {
      const leadRef = doc(db, LEADS_COLLECTION, leadId);
      return await updateDoc(leadRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        lastMovedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  updateLeadData: async (leadId: string, data: Partial<Lead>) => {
    const path = `${LEADS_COLLECTION}/${leadId}`;
    try {
      const leadRef = doc(db, LEADS_COLLECTION, leadId);
      return await updateDoc(leadRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  updateNestedField: async (leadId: string, fieldPath: string, value: any) => {
    const path = `${LEADS_COLLECTION}/${leadId}`;
    try {
      const leadRef = doc(db, LEADS_COLLECTION, leadId);
      return await updateDoc(leadRef, {
        [fieldPath]: value,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  subscribeToLeads: (callback: (leads: Lead[]) => void) => {
    const q = query(collection(db, LEADS_COLLECTION), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const leads = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          status: mapStatus(data.status || '')
        };
      }) as Lead[];
      callback(leads);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, LEADS_COLLECTION);
    });
  },

  getLead: async (leadId: string) => {
    try {
      const leadRef = doc(db, LEADS_COLLECTION, leadId);
      const leadSnap = await getDoc(leadRef);
      if (leadSnap.exists()) {
        const data = leadSnap.data();
        return { 
          id: leadSnap.id, 
          ...data,
          status: mapStatus(data.status || '')
        } as Lead;
      }
      return null;
    } catch (error) {
      console.warn(`[leadsService] getLead failed for ${leadId}:`, error);
      return null;
    }
  },

  deleteLead: async (leadId: string) => {
    const path = `${LEADS_COLLECTION}/${leadId}`;
    try {
      const leadRef = doc(db, LEADS_COLLECTION, leadId);
      return await deleteDoc(leadRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  wipeAllLeads: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, LEADS_COLLECTION));
      const deletePromises = querySnapshot.docs.map(document => 
        deleteDoc(doc(db, LEADS_COLLECTION, document.id))
      );
      await Promise.all(deletePromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, LEADS_COLLECTION);
    }
  }
};

