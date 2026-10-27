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

export type ContactType = 'Owner' | 'Renter' | 'Buyer' | 'Agent';

export interface Contact {
  id?: string;
  contactId?: string; // e.g. CO1, CO2, CO1026
  firstName: string;
  lastName: string;
  type: ContactType;
  phone: string;
  propertyId: string;
  commissionValue?: string;
  createdAt: any;
  updatedAt: any;
}

const CONTACTS_COLLECTION = 'contacts';

export const contactsService = {
  addContact: async (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const contactId = contactData.contactId || (await entityIdService.getNextId('client'));
      const now = serverTimestamp();
      return await addDoc(collection(db, CONTACTS_COLLECTION), {
        ...contactData,
        contactId,
        createdAt: now,
        updatedAt: now
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, CONTACTS_COLLECTION);
    }
  },

  updateContact: async (contactId: string, data: Partial<Contact>) => {
    const path = `${CONTACTS_COLLECTION}/${contactId}`;
    try {
      const contactRef = doc(db, CONTACTS_COLLECTION, contactId);
      return await updateDoc(contactRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  subscribeToContacts: (callback: (contacts: Contact[]) => void) => {
    const q = query(collection(db, CONTACTS_COLLECTION), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const contacts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contact[];
      callback(contacts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, CONTACTS_COLLECTION);
    });
  },

  subscribeToPropertyContacts: (propertyId: string, callback: (contacts: Contact[]) => void) => {
    const q = query(
      collection(db, CONTACTS_COLLECTION), 
      where('propertyId', '==', propertyId),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const contacts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contact[];
      callback(contacts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, CONTACTS_COLLECTION);
    });
  },

  getContact: async (contactId: string) => {
    const path = `${CONTACTS_COLLECTION}/${contactId}`;
    try {
      const contactRef = doc(db, CONTACTS_COLLECTION, contactId);
      const contactSnap = await getDoc(contactRef);
      if (contactSnap.exists()) {
        return { id: contactSnap.id, ...contactSnap.data() } as Contact;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  deleteContact: async (contactId: string) => {
    const path = `${CONTACTS_COLLECTION}/${contactId}`;
    try {
      const contactRef = doc(db, CONTACTS_COLLECTION, contactId);
      return await deleteDoc(contactRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
