export * from './leadsService';
import { leadsService, Lead, LeadStatus } from './leadsService';

export const leadService = {
  addLead: leadsService.addLead,
  updateLeadStatus: leadsService.updateLeadStatus,
  updateLeadData: leadsService.updateLeadData,
  updateNestedField: leadsService.updateNestedField,
  deleteLead: leadsService.deleteLead,
  getLead: leadsService.getLead,
  subscribeToLeads: leadsService.subscribeToLeads
};

export const propertyService = {
  addProperty: leadsService.addLead,
  updatePropertyStatus: leadsService.updateLeadStatus,
  updatePropertyData: leadsService.updateLeadData,
  deleteProperty: leadsService.deleteLead,
  getProperty: leadsService.getLead,
  subscribeToProperties: leadsService.subscribeToLeads
};

export const requestService = {
  addRequest: leadsService.addLead,
  updateRequestStatus: leadsService.updateLeadStatus,
  updateRequestData: leadsService.updateLeadData,
  deleteRequest: leadsService.deleteLead,
  getRequest: leadsService.getLead,
  subscribeToRequests: leadsService.subscribeToLeads
};
