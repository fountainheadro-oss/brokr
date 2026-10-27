import { 
  doc, 
  runTransaction, 
  collection, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export type EntityType = 
  | 'lead' 
  | 'request' 
  | 'cerere' 
  | 'property' 
  | 'client' 
  | 'contact' 
  | 'staff' 
  | 'personal' 
  | 'document' 
  | 'activity'
  | 'activitate'
  | 'tour' 
  | 'viewing';

const PREFIX_MAP: Record<string, string> = {
  lead: 'L',
  request: 'R',
  cerere: 'R',
  property: 'P',
  client: 'C',
  contact: 'C',
  staff: 'S',
  personal: 'S',
  document: 'D',
  activity: 'A',
  activitate: 'A',
  tour: 'A',
  viewing: 'A'
};

const COUNTERS_DOC = 'counters/entities';

export const entityIdService = {
  /**
   * Generates the next sequential ID for the given entity type:
   * - lead: L1, L2, L1023...
   * - request / cerere: R1, R2, R1024...
   * - property: P1, P2, P1025...
   * - client / contact: C1, C2, C1027...
   * - staff / personal: S1, S2, S1026...
   * - document: D01, D02... D1029...
   * - activity: A1, A2, A1022...
   */
  getNextId: async (type: EntityType): Promise<string> => {
    // Normalize keys to standard English names
    let key = type;
    if (type === 'cerere') key = 'request';
    if (type === 'contact') key = 'client';
    if (type === 'personal') key = 'staff';
    if (type === 'activitate' || type === 'tour' || type === 'viewing') key = 'activity';

    const prefix = PREFIX_MAP[type] || 'X';
    const counterRef = doc(db, COUNTERS_DOC);

    try {
      const nextNum = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(counterRef);
        let currentCounters = snap.exists() ? snap.data() : null;

        // If counter document does not exist yet, initialize it by checking existing documents
        if (!currentCounters || typeof currentCounters[key] !== 'number') {
          const maxExisting = await entityIdService.getMaxExistingNumber(type);
          currentCounters = {
            ...(currentCounters || {}),
            [key]: maxExisting
          };
        }

        const newCount = (currentCounters[key] || 0) + 1;
        transaction.set(counterRef, {
          ...currentCounters,
          [key]: newCount
        }, { merge: true });

        return newCount;
      });

      // Format document with leading zero if single digit (D01, D02 ... D1029)
      if (key === 'document') {
        const formattedNum = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
        return `${prefix}${formattedNum}`;
      }

      return `${prefix}${nextNum}`;
    } catch (error) {
      console.error(`[entityIdService] Error generating ID for ${type}:`, error);
      // Fallback with unique integer if offline or error
      const fallbackNum = Math.floor(Date.now() % 100000);
      if (type === 'document') {
        const formatted = fallbackNum < 10 ? `0${fallbackNum}` : `${fallbackNum}`;
        return `${prefix}${formatted}`;
      }
      return `${prefix}${fallbackNum}`;
    }
  },

  /**
   * Helper to inspect existing documents and find the highest number for initial seeding
   */
  getMaxExistingNumber: async (type: EntityType): Promise<number> => {
    let key = type;
    if (type === 'cerere') key = 'request';
    if (type === 'contact') key = 'client';
    if (type === 'personal') key = 'staff';
    if (type === 'activitate' || type === 'tour' || type === 'viewing') key = 'activity';

    const prefix = PREFIX_MAP[type];
    let regex = new RegExp(`^${prefix}(\\d+)$`, 'i');
    if (key === 'request') regex = new RegExp(`^(?:R|RE)(\\d+)$`, 'i');
    if (key === 'property') regex = new RegExp(`^(?:P|PR)(\\d+)$`, 'i');
    if (key === 'client') regex = new RegExp(`^(?:C|CO|CL)(\\d+)$`, 'i');
    if (key === 'staff') regex = new RegExp(`^(?:S|ST)(\\d+)$`, 'i');
    if (key === 'document') regex = new RegExp(`^D(\\d+)$`, 'i');
    if (key === 'activity') regex = new RegExp(`^(?:A|T)(\\d+)$`, 'i');

    let max = 0;

    try {
      if (key === 'client') {
        const snap = await getDocs(collection(db, 'contacts'));
        snap.docs.forEach((d) => {
          const data = d.data();
          const candidate = data.clientId || data.contactId || data.propertyId || '';
          const match = String(candidate).match(regex);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > max) max = num;
          }
        });
      } else if (key === 'staff') {
        const snap = await getDocs(collection(db, 'personal'));
        snap.docs.forEach((d) => {
          const data = d.data();
          const candidate = data.staffId || data.personalId || '';
          const match = String(candidate).match(regex);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > max) max = num;
          }
        });
      } else if (key === 'document') {
        const snap = await getDocs(collection(db, 'documents'));
        snap.docs.forEach((d) => {
          const data = d.data();
          const candidate = data.documentId || '';
          const match = String(candidate).match(regex);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > max) max = num;
          }
        });
      } else if (key === 'activity') {
        // Check activities collection
        try {
          const snapAct = await getDocs(collection(db, 'activities'));
          snapAct.docs.forEach((d) => {
            const data = d.data();
            const candidate = data.activityId || data.tourId || '';
            const match = String(candidate).match(regex);
            if (match && match[1]) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > max) max = num;
            }
          });
        } catch (_) {}

        // Also check tours collection
        try {
          const snapTours = await getDocs(collection(db, 'tours'));
          snapTours.docs.forEach((d) => {
            const data = d.data();
            const candidate = data.activityId || data.tourId || '';
            const match = String(candidate).match(regex);
            if (match && match[1]) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > max) max = num;
            }
          });
        } catch (_) {}
      } else {
        const snap = await getDocs(collection(db, 'leads'));
        snap.docs.forEach((d) => {
          const data = d.data();
          const candidate = data.propertyId || '';
          const match = String(candidate).match(regex);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > max) max = num;
          }
        });
      }
    } catch (e) {
      console.warn(`[entityIdService] Could not inspect existing max for ${type}:`, e);
    }

    return max;
  }
};
