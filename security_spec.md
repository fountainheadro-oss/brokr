# Security Specification - Real Estate Miner

## 1. Data Invariants
- **Lead ID Integrity**: Document IDs must be valid alphanumeric strings.
- **Status Machine**: Status must follow the sequence `Lead-uri` -> `Prospectare` -> `Publicare` -> `Cerere` -> `Vizionare` -> `Semnare`.
- **Tenant Isolation**: Only authenticated users can read/write leads (demo mode assumes one team/user for now).
- **Immutability**: `createdAt` cannot be changed after creation.
- **Temporal Integrity**: `updatedAt` and `lastMovedAt` must be server timestamps.

## 2. The "Dirty Dozen" Payloads (Red Team Test)
1. **Identity Spoofing**: `create` lead with `ownerId` of another user. (Rejected)
2. **Schema Poisoning**: `create` lead with a 2MB `title` string. (Rejected)
3. **Ghost Fields**: `create` lead with `isVerified: true` (not in schema). (Rejected)
4. **Invalid Status**: `create` lead with `status: 'BOGUS'`. (Rejected)
5. **Time Travel**: `update` `createdAt` to a past date. (Rejected)
6. **Orphaned Write**: `update` `status` without updating `lastMovedAt`. (Rejected)
7. **Type Mismatch**: `update` `price` with a boolean instead of string. (Rejected)
8. **Malicious ID**: `create` lead with ID `../../secrets`. (Rejected)
9. **Blanket Read**: Attempt `list` leads without being signed in. (Rejected)
10. **State Corruption**: `update` `transactionType` to something other than "Vânzare" or "Închiriere". (Rejected)
11. **Shadow Update**: `update` `extractedData` without incrementing `updatedAt`. (Rejected)
12. **Malicious URL**: `create` lead with 10KB URL string. (Rejected)
