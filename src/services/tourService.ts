import { activityService, Activity, ActivityType, ActivityStatus } from './activityService';

export type Tour = Activity & { tourId?: string };

export const tourService = {
  addTour: async (tourData: any) => {
    return await activityService.addActivity({
      ...tourData,
      type: tourData.type || 'Vizionare'
    });
  },
  updateTour: activityService.updateActivity,
  deleteTour: activityService.deleteActivity,
  getTour: activityService.getActivity,
  subscribeToPropertyTours: (propertyId: string, callback: (tours: Tour[]) => void) => {
    return activityService.subscribeToPropertyActivities(propertyId, callback as any);
  },
  subscribeToAllTours: (callback: (tours: Tour[]) => void) => {
    return activityService.subscribeToAllActivities(callback as any);
  }
};
