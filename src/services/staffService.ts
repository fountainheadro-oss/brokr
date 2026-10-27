export * from './personalService';
import { personalService, PersonalMember, PersonalStatus } from './personalService';

export type StaffMember = PersonalMember;
export type StaffStatus = PersonalStatus;

export const staffService = {
  addStaffMember: personalService.addPersonalMember,
  updateStaffMember: personalService.updatePersonalMember,
  deleteStaffMember: personalService.deletePersonalMember,
  getStaffMember: personalService.getPersonalMember,
  subscribeToStaff: personalService.subscribeToPersonal
};
