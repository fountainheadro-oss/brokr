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

export type ActivityType = 
  | 'Vizionare' 
  | 'Întâlnire' 
  | 'Apel' 
  | 'Evaluare' 
  | 'Semnare'
  | 'Semnare Contract' 
  | 'Notă' 
  | 'Altele';

export type ActivityStatus = 'Programată' | 'Realizată' | 'Anulată';

export interface Activity {
  id?: string;
  activityId?: string; // A1, A2, A1022...
  title?: string;
  type: ActivityType;
  propertyId?: string;
  clientId?: string;
  clientName: string;
  clientPhone?: string;
  staffId?: string;
  staffName?: string;
  date: string;
  hour: string;
  status?: ActivityStatus;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

const ACTIVITIES_COLLECTION = 'activities';

const cleanUndefined = (obj: any): any => {
  const result: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
};

export const activityService = {
  addActivity: async (data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const activityId = data.activityId || (await entityIdService.getNextId('activity'));
      const now = serverTimestamp();
      const sanitized = cleanUndefined({
        ...data,
        activityId,
        type: data.type || 'Vizionare',
        status: data.status || 'Programată'
      });

      // Save into activities collection
      const docRef = await addDoc(collection(db, ACTIVITIES_COLLECTION), {
        ...sanitized,
        createdAt: now,
        updatedAt: now
      });

      // Mirror to tours and viewings collections for backwards compatibility & calendar sync
      try {
        await addDoc(collection(db, 'tours'), {
          tourId: activityId,
          activityId,
          propertyId: data.propertyId || '',
          clientId: data.clientId || '',
          clientName: data.clientName || 'Client',
          clientPhone: data.clientPhone || '',
          staffId: data.staffId || '',
          staffName: data.staffName || '',
          date: data.date,
          hour: data.hour,
          status: data.status || 'Programată',
          notes: data.notes || '',
          createdAt: now,
          updatedAt: now
        });
      } catch (err) {
        console.warn('[activityService] Mirroring to tours failed:', err);
      }

      try {
        await addDoc(collection(db, 'viewings'), {
          propertyId: data.propertyId || '',
          contactId: data.clientId || activityId,
          contactName: data.clientName || 'Client',
          agentId: data.staffId || '',
          agentName: data.staffName || '',
          date: data.date,
          hour: data.hour,
          activityId,
          createdAt: now,
          updatedAt: now
        });
      } catch (err) {
        console.warn('[activityService] Mirroring to viewings failed:', err);
      }

      return docRef;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, ACTIVITIES_COLLECTION);
    }
  },

  updateActivity: async (activityDocId: string, data: Partial<Activity>) => {
    const path = `${ACTIVITIES_COLLECTION}/${activityDocId}`;
    try {
      const ref = doc(db, ACTIVITIES_COLLECTION, activityDocId);
      return await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  deleteActivity: async (activityDocId: string) => {
    const path = `${ACTIVITIES_COLLECTION}/${activityDocId}`;
    try {
      const ref = doc(db, ACTIVITIES_COLLECTION, activityDocId);
      return await deleteDoc(ref);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  getActivity: async (activityDocId: string) => {
    const path = `${ACTIVITIES_COLLECTION}/${activityDocId}`;
    try {
      const ref = doc(db, ACTIVITIES_COLLECTION, activityDocId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Activity;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  subscribeToPropertyActivities: (propertyId: string, callback: (activities: Activity[]) => void) => {
    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      where('propertyId', '==', propertyId),
      orderBy('date', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const activities = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Activity[];
      callback(activities);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, ACTIVITIES_COLLECTION);
    });
  },

  subscribeToAllActivities: (callback: (activities: Activity[]) => void) => {
    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      orderBy('date', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const activities = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Activity[];
      callback(activities);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, ACTIVITIES_COLLECTION);
    });
  }
};
