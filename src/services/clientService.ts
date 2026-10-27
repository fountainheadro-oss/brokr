export * from './contactsService';
import { contactsService, Contact, ContactType } from './contactsService';

export type Client = Contact;
export type ClientType = ContactType;

export const clientService = {
  addClient: contactsService.addContact,
  updateClient: contactsService.updateContact,
  deleteClient: contactsService.deleteContact,
  getClient: contactsService.getContact,
  subscribeToClients: contactsService.subscribeToContacts,
  subscribeToPropertyClients: contactsService.subscribeToPropertyContacts
};
