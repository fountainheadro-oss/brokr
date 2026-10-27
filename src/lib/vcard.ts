import { Contact } from "../services/contactsService";

export const downloadVCard = (contact: Contact, propertyId?: string) => {
  const propIdReal = propertyId || "";
  const fullName = `${contact.firstName || ""} ${contact.lastName || ""}`.trim();

  // "First name will always be the property ID number, then the last name will be the full name."
  // N format: FamilyName (Last name); GivenName (First name); MiddleName; Prefix; Suffix
  const vcardContent = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${fullName};${propIdReal};;;`,
    `FN:${propIdReal} ${fullName}`,
    `TEL;TYPE=CELL:${contact.phone || ""}`,
    `NOTE:Tip contact: ${contact.type || ""}`,
    "END:VCARD"
  ].join("\r\n");

  const blob = new Blob([vcardContent], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const filename = propIdReal 
    ? `${propIdReal}_${fullName.replace(/\s+/g, '_')}.vcf`
    : `${fullName.replace(/\s+/g, '_')}.vcf`;

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
