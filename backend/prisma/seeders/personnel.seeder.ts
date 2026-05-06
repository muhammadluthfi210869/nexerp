import { PrismaClient, UserRole, Division, ContractType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

interface PersonnelSeed {
  email: string;
  fullName: string;
  roles: UserRole[];
  division: Division;
  roleName: string;
  joinedAt: string;
  contractType: ContractType;
  contractEnd?: string;
}

const PERSONNEL: PersonnelSeed[] = [
  // EXECUTIVE
  { email: 'zaki@dreamlab.com', fullName: 'Zaki', roles: [UserRole.SUPER_ADMIN], division: Division.MANAGEMENT, roleName: 'Direktur Utama', joinedAt: '01/01/2019', contractType: ContractType.PERMANENT },
  // OPERATIONAL HEADS
  { email: 'fadhilah@dreamlab.com', fullName: 'Fadhilah', roles: [UserRole.HEAD_OPS, UserRole.MARKETING], division: Division.MANAGEMENT, roleName: 'Head Ops Pemasaran', joinedAt: '01/06/2020', contractType: ContractType.PERMANENT },
  { email: 'bagir@dreamlab.com', fullName: 'Bagir', roles: [UserRole.HEAD_OPS, UserRole.PRODUCTION, UserRole.PURCHASING], division: Division.MANAGEMENT, roleName: 'Head Ops Manufacture', joinedAt: '01/01/2020', contractType: ContractType.PERMANENT },
  // FINANCE
  { email: 'irma@dreamlab.com', fullName: 'Irma', roles: [UserRole.FINANCE, UserRole.PURCHASING], division: Division.FINANCE, roleName: 'Bendahara', joinedAt: '12/05/2020', contractType: ContractType.PERMANENT },
  { email: 'tika@dreamlab.com', fullName: 'Tika', roles: [UserRole.FINANCE, UserRole.ADMIN], division: Division.FINANCE, roleName: 'Accounting & Admin', joinedAt: '10/01/2022', contractType: ContractType.CONTRACT, contractEnd: '31/12/2025' },
  // ADMIN / SECRETARIAT
  { email: 'salsa@dreamlab.com', fullName: 'Salsa', roles: [UserRole.ADMIN], division: Division.MANAGEMENT, roleName: 'Sekretaris', joinedAt: '15/02/2022', contractType: ContractType.CONTRACT, contractEnd: '31/12/2025' },
  // COMPLIANCE & QA
  { email: 'amira@dreamlab.com', fullName: 'Amira', roles: [UserRole.COMPLIANCE, UserRole.RND], division: Division.LEGAL, roleName: 'Penyelia Halal & CPKB', joinedAt: '10/03/2021', contractType: ContractType.CONTRACT, contractEnd: '31/12/2024' },
  { email: 'ciptaning@dreamlab.com', fullName: 'Ciptaning', roles: [UserRole.APJ, UserRole.COMPLIANCE], division: Division.LEGAL, roleName: 'Legal (APJ/QA)', joinedAt: '22/06/2022', contractType: ContractType.CONTRACT, contractEnd: '22/06/2025' },
  // HR & LEGAL
  { email: 'yulia@dreamlab.com', fullName: 'Yulia', roles: [UserRole.HR], division: Division.MANAGEMENT, roleName: 'Manager HR', joinedAt: '01/01/2019', contractType: ContractType.PERMANENT },
  { email: 'diaz@dreamlab.com', fullName: 'Diaz', roles: [UserRole.HR, UserRole.MARKETING], division: Division.MANAGEMENT, roleName: 'Asst HR & Legal', joinedAt: '14/11/2022', contractType: ContractType.CONTRACT, contractEnd: '14/11/2024' },
  // DIGITAL MARKETING / CREATIVE
  { email: 'bagus@dreamlab.com', fullName: 'Bagus', roles: [UserRole.IT_SYS], division: Division.SYSTEM, roleName: 'System & Web', joinedAt: '10/01/2021', contractType: ContractType.PERMANENT },
  { email: 'revita@dreamlab.com', fullName: 'Revita', roles: [UserRole.DIGIMAR], division: Division.CREATIVE, roleName: 'DM Strategy', joinedAt: '05/03/2023', contractType: ContractType.CONTRACT, contractEnd: '05/03/2026' },
  { email: 'gusti@dreamlab.com', fullName: 'Gusti', roles: [UserRole.DIGIMAR], division: Division.CREATIVE, roleName: 'Graphic Designer', joinedAt: '12/06/2023', contractType: ContractType.CONTRACT, contractEnd: '12/06/2024' },
  { email: 'zarkasi@dreamlab.com', fullName: 'Zarkasi', roles: [UserRole.DIGIMAR], division: Division.CREATIVE, roleName: 'Video Editor', joinedAt: '01/08/2023', contractType: ContractType.CONTRACT, contractEnd: '01/08/2024' },
  // MARKETING & DEVELOPMENT
  { email: 'nisa@dreamlab.com', fullName: 'Nisa', roles: [UserRole.MARKETING], division: Division.BD, roleName: 'Marketing', joinedAt: '20/01/2022', contractType: ContractType.CONTRACT, contractEnd: '31/12/2024' },
  { email: 'diva@dreamlab.com', fullName: 'Diva', roles: [UserRole.MARKETING], division: Division.BD, roleName: 'Marketing', joinedAt: '22/01/2022', contractType: ContractType.CONTRACT, contractEnd: '31/12/2024' },
  // R&D
  { email: 'edi@dreamlab.com', fullName: 'Edi', roles: [UserRole.RND], division: Division.RND, roleName: 'Packaging Specialist', joinedAt: '10/05/2021', contractType: ContractType.PERMANENT },
  { email: 'panca@dreamlab.com', fullName: 'Panca', roles: [UserRole.RND], division: Division.RND, roleName: 'Asst R&D', joinedAt: '12/04/2023', contractType: ContractType.CONTRACT, contractEnd: '12/04/2024' },
  // PRODUCTION
  { email: 'muhammad@dreamlab.com', fullName: 'Muhammad', roles: [UserRole.PRODUCTION], division: Division.PRODUCTION, roleName: 'Head Production', joinedAt: '10/01/2020', contractType: ContractType.PERMANENT },
  { email: 'lila@dreamlab.com', fullName: 'Lila', roles: [UserRole.ADMIN, UserRole.PRODUCTION], division: Division.PRODUCTION, roleName: 'Admin Pabrik', joinedAt: '15/05/2022', contractType: ContractType.CONTRACT, contractEnd: '31/12/2024' },
  { email: 'hasyim@dreamlab.com', fullName: 'Hasyim', roles: [UserRole.PRODUCTION_OP], division: Division.PRODUCTION, roleName: 'Operator Sanitasi', joinedAt: '20/02/2023', contractType: ContractType.CONTRACT, contractEnd: '20/08/2024' },
  { email: 'agus@dreamlab.com', fullName: 'Agus', roles: [UserRole.PRODUCTION_OP], division: Division.PRODUCTION, roleName: 'Operator Produksi', joinedAt: '12/06/2023', contractType: ContractType.PROBATION, contractEnd: '12/06/2024' },
  { email: 'makhmud@dreamlab.com', fullName: 'Makhmud', roles: [UserRole.PRODUCTION_OP], division: Division.PRODUCTION, roleName: 'Operator Produksi', joinedAt: '01/08/2023', contractType: ContractType.CONTRACT, contractEnd: '01/08/2024' },
  // QC
  { email: 'ribut@dreamlab.com', fullName: 'Ribut', roles: [UserRole.QC_LAB], division: Division.QC, roleName: 'Captain QC', joinedAt: '10/01/2020', contractType: ContractType.PERMANENT },
  { email: 'rudi@dreamlab.com', fullName: 'Rudi', roles: [UserRole.PRODUCTION], division: Division.PRODUCTION, roleName: 'Captain Packing', joinedAt: '15/01/2021', contractType: ContractType.PERMANENT },
  // WAREHOUSE
  { email: 'ghufran@dreamlab.com', fullName: 'Ghufran', roles: [UserRole.WAREHOUSE], division: Division.WAREHOUSE, roleName: 'Head Warehouse', joinedAt: '01/01/2020', contractType: ContractType.PERMANENT },
  { email: 'raka@dreamlab.com', fullName: 'Raka', roles: [UserRole.WAREHOUSE], division: Division.WAREHOUSE, roleName: 'Warehouse Staff', joinedAt: '12/03/2023', contractType: ContractType.CONTRACT, contractEnd: '12/03/2024' },
];

function parseDate(dateStr: string): Date {
  const [dd, mm, yyyy] = dateStr.split('/').map(Number);
  return new Date(yyyy, mm - 1, dd);
}

export async function seedPersonnel(prisma: PrismaClient) {
  console.log('🌱 Seeding Personnel (24 Real Users)...');

  const hashedPassword = await bcrypt.hash('123', 10);

  for (const p of PERSONNEL) {
    // Create User
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {
        fullName: p.fullName,
        passwordHash: hashedPassword,
        roles: p.roles,
        status: 'ACTIVE',
      },
      create: {
        email: p.email,
        fullName: p.fullName,
        passwordHash: hashedPassword,
        roles: p.roles,
        status: 'ACTIVE',
      },
    });

    // Create Employee linked to User
    const employee = await prisma.employee.upsert({
      where: { userId: user.id },
      update: {
        name: p.fullName,
        joinedAt: parseDate(p.joinedAt),
        contractType: p.contractType,
        contractEnd: p.contractEnd ? parseDate(p.contractEnd) : null,
        isActive: true,
        baseSalary: 'ENCRYPTED_DUMMY',
      },
      create: {
        userId: user.id,
        name: p.fullName,
        joinedAt: parseDate(p.joinedAt),
        contractType: p.contractType,
        contractEnd: p.contractEnd ? parseDate(p.contractEnd) : null,
        isActive: true,
        baseSalary: 'ENCRYPTED_DUMMY',
      },
    });

    // Delete old role mappings for this employee
    await prisma.employeeRoleMapping.deleteMany({
      where: { employeeId: employee.id },
    });

    // Create primary role mapping
    await prisma.employeeRoleMapping.create({
      data: {
        employeeId: employee.id,
        division: p.division,
        roleName: p.roleName,
        weight: 1.0,
        isPrimary: true,
      },
    });

    // If user has multiple divisions via roles, add secondary mappings
    const secondaryRoles = p.roles.filter((r) => {
      // Map UserRole to Division for secondary mappings
      const roleDivMap: Record<string, Division> = {
        [UserRole.PURCHASING]: Division.SCM,
        [UserRole.MARKETING]: Division.BD,
        [UserRole.RND]: Division.RND,
        [UserRole.COMPLIANCE]: Division.LEGAL,
        [UserRole.APJ]: Division.LEGAL,
        [UserRole.ADMIN]: Division.MANAGEMENT,
        [UserRole.PRODUCTION]: Division.PRODUCTION,
        [UserRole.HEAD_OPS]: Division.MANAGEMENT,
        [UserRole.FINANCE]: Division.FINANCE,
        [UserRole.HR]: Division.MANAGEMENT,
        [UserRole.IT_SYS]: Division.SYSTEM,
        [UserRole.DIGIMAR]: Division.CREATIVE,
        [UserRole.QC_LAB]: Division.QC,
        [UserRole.WAREHOUSE]: Division.WAREHOUSE,
        [UserRole.PRODUCTION_OP]: Division.PRODUCTION,
        [UserRole.SUPER_ADMIN]: Division.MANAGEMENT,
        [UserRole.SCM]: Division.SCM,
        [UserRole.DIRECTOR]: Division.MANAGEMENT,
        [UserRole.PPIC]: Division.PRODUCTION,
      };
      const div = roleDivMap[r];
      return div && div !== p.division;
    });

    // Deduplicate secondary divisions
    const addedDivs = new Set<Division>([p.division]);
    for (const role of secondaryRoles) {
      const roleDivMap: Record<string, Division> = {
        PURCHASING: Division.SCM,
        MARKETING: Division.BD,
        RND: Division.RND,
        COMPLIANCE: Division.LEGAL,
        APJ: Division.LEGAL,
        ADMIN: Division.MANAGEMENT,
        PRODUCTION: Division.PRODUCTION,
        HEAD_OPS: Division.MANAGEMENT,
        FINANCE: Division.FINANCE,
        HR: Division.MANAGEMENT,
        IT_SYS: Division.SYSTEM,
        DIGIMAR: Division.CREATIVE,
        QC_LAB: Division.QC,
        WAREHOUSE: Division.WAREHOUSE,
        PRODUCTION_OP: Division.PRODUCTION,
        SUPER_ADMIN: Division.MANAGEMENT,
        SCM: Division.SCM,
        DIRECTOR: Division.MANAGEMENT,
        PPIC: Division.PRODUCTION,
      };
      const div = roleDivMap[role];
      if (div && !addedDivs.has(div)) {
        addedDivs.add(div);
        await prisma.employeeRoleMapping.create({
          data: {
            employeeId: employee.id,
            division: div,
            roleName: `${role} (Merangkap)`,
            weight: 0.5,
            isPrimary: false,
          },
        });
      }
    }

    console.log(`  ✅ ${p.fullName} (${p.email}) — Roles: [${p.roles.join(', ')}]`);
  }

  console.log('✅ Personnel Seeding Complete.');
}
