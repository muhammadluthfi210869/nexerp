# Purchase Core Cleanup (Item 73)

## Overview
Audit of columns in PO/POItem/Product tables that are not used in backend logic.
Per spec: DO NOT drop columns - hide via service layer.

## Tables Audited

### purchase_orders
| Column | Usage Status | Notes |
|--------|-------------|-------|
| taxPercent | PARTIAL | Stored but not used in calculations |
| currencyId | NONE | Not used in any business logic |
| leadId | PARTIAL | Stored on PO but not used in payment/approval flow |
| notes | PARTIAL | Stored but not used in calculations |

### purchase_order_items
| Column | Usage Status | Notes |
|--------|-------------|-------|
| taxId | PARTIAL | Stored but not used in calculations |
| receivedQty | PARTIAL | Updated by inbound but not used in payable calc |

### material_items
| Column | Usage Status | Notes |
|--------|-------------|-------|
| lastSyncedAt | NONE | Not used anywhere |
| halalCertNo | NONE | Not used in procurement logic |
| halalExpDate | NONE | Not used in procurement logic |
| isHalalValidated | NONE | Not used in procurement logic |
| halalCertUrl | NONE | Not used in procurement logic |
| maxHoldHours | NONE | Not enforced in any logic |
| isCritical | NONE | Not used in any service |

## Action Items
1. Do NOT return these fields in list/detail DTOs where possible
2. Document for future removal (post-migration confirmation)
3. Frontend should stop referencing these fields in display logic

## Implementation
Fields are HIDDEN via service layer (not returned in API) rather than dropped.
This maintains backward compatibility with any external consumers.
