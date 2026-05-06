## 1. Role Mapping Strategy



The system uses an RBAC (Role-Based Access Control) system with a `UserRole` enum and `EmployeeRoleMapping`. Each user will be assigned one or more roles based on their responsibilities.



### Executive Level

- **Zaki (Direktur Utama)**: `DASHBOARD ONLY`

  - Access: dashboard executive, notification and each dashboard of all division    



### Operational Heads

- **Fadhilah (Head Ops Pemasaran)**: `HEAD_OPS`, `MARKETING`

  - Access: Marketing strategy, lead management, sales reports.

- **Bagir (Head Ops Manufacture)**: `HEAD_OPS`, `PRODUCTION`, `PURCHASING`, `SCM`

  - Access: Factory operations, supply chain, procurement, warehouse oversight.



### Departments

- **Finance (Irma, Tika)**: `FINANCE`, `PURCHASING` (for Irma)

  - Access: Ledger, cash flow, invoicing, payment verification.

- **HR & Legal (Yulia, Diaz)**: `HR`

  - Access: Payroll, attendance, KPI, employee contracts.

- **Digital Marketing (Bagus, Revita, Gusti, Zarkasi)**: `DIGIMAR`, `IT_SYS` (for Bagus)

  - Access: Ads tracking, traffic analytics, creative asset management.

- **Production & QC (Muhammad, Lila, etc.)**: `PRODUCTION`, `QC_LAB`, `PRODUCTION_OP`

  - Access: Batch logs, quality checks, machine monitoring.

- **Warehouse (Ghufran, Raka)**: `WAREHOUSE`

  - Access: Stock management, inbound/outbound delivery.



## 2. Implementation Steps



1. **Email Generation**: I will generate standard emails (e.g., `name@dreamlab.com`) for all personnel.

2. **Database Seeding**: Create a script `prisma/seed-personnel.ts` to populate the `users`, `employees`, and `employee_role_mappings` tables.

3. **Verification**: Run a check to ensure all users are correctly linked to their roles.



## 3. Account List Preview



| Name | Role(s) | Email (Placeholder) |

| :--- | :--- | :--- |

| Zaki | SUPER_ADMIN | zaki@dreamlab.com |

| Fadhilah | HEAD_OPS, MARKETING | fadhilah@dreamlab.com |

| Bagir | HEAD_OPS, PRODUCTION, PURCHASING | bagir@dreamlab.com |

| Irma | FINANCE, PURCHASING | irma@dreamlab.com |

| Tika | FINANCE, ADMIN | tika@dreamlab.com |

| Salsa | ADMIN | salsa@dreamlab.com |

| Amira | COMPLIANCE, RND | amira@dreamlab.com |

| Ciptaning | APJ, COMPLIANCE | ciptaning@dreamlab.com |

| Yulia | HR | yulia@dreamlab.com |

| Diaz | HR, MARKETING | diaz@dreamlab.com |

| Bagus | IT_SYS | bagus@dreamlab.com |

| Revita | DIGIMAR | revita@dreamlab.com |

| Gusti | DIGIMAR | gusti@dreamlab.com |

| Zarkasi | DIGIMAR | zarkasi@dreamlab.com |

| Nisa | MARKETING | nisa@dreamlab.com |

| Diva | MARKETING | diva@dreamlab.com |

| Edi | RND | edi@dreamlab.com |

| Panca | RND | panca@dreamlab.com |

| Muhammad [?] | PRODUCTION | muhammad@dreamlab.com |

| Lila | ADMIN, PRODUCTION | lila@dreamlab.com |

| Hasyim | PRODUCTION_OP | hasyim@dreamlab.com |

| Agus | PRODUCTION_OP | agus@dreamlab.com |

| Makhmud | PRODUCTION_OP | makhmud@dreamlab.com |

| Ribut | QC_LAB | ribut@dreamlab.com |

| Rudi | PRODUCTION | rudi@dreamlab.com |

| Ghufran | WAREHOUSE | ghufran@dreamlab.com |

| Raka | WAREHOUSE | raka@dreamlab.com |



## 4. Security

- Default password for all initial accounts: `DreamLab2024!` (Force change on first login recommended).

- Roles are strictly enforced via NestJS Guards in the backend.