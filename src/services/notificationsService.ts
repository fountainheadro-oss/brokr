import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit, 
  updateDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

export interface Notification {
  id?: string;
  title: string;
  message: string;
  type: 'lead' | 'viewing' | 'system';
  createdAt: any;
  read: boolean;
  userId: string;
}

const COLLECTION_NAME = 'notifications';

export const notificationsService = {
  getNotifications: (callback: (notifications: Notification[]) => void) => {
    if (!auth.currentUser) return () => {};

    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      callback(notifications);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
    });
  },

  markAsRead: async (notificationId: string) => {
    const notificationRef = doc(db, COLLECTION_NAME, notificationId);
    try {
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, COLLECTION_NAME);
    }
  },

  addNotification: async (notification: Omit<Notification, 'id' | 'createdAt' | 'read' | 'userId'>) => {
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, COLLECTION_NAME), {
        ...notification,
        read: false,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    }
  }
};
