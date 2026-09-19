import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

export interface DivisionItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

const CANONICAL_DIVISIONS: DivisionItem[] = [
  { id: '00000000-0000-0000-0000-000000000011', code: 'SCM', name: 'Supply Chain Management', isActive: true },
  { id: '00000000-0000-0000-0000-000000000012', code: 'PRD', name: 'Production', isActive: true },
  { id: '00000000-0000-0000-0000-000000000013', code: 'QC', name: 'Quality Control', isActive: true },
  { id: '00000000-0000-0000-0000-000000000014', code: 'FIN', name: 'Finance & Accounting', isActive: true },
  { id: '00000000-0000-0000-0000-000000000015', code: 'HR', name: 'Human Resources', isActive: true },
  { id: '00000000-0000-0000-0000-000000000016', code: 'IT', name: 'Information Technology', isActive: true },
  { id: '00000000-0000-0000-0000-000000000017', code: 'RND', name: 'Research & Development', isActive: true },
  { id: '00000000-0000-0000-0000-000000000018', code: 'MKT', name: 'Marketing & Sales', isActive: true },
];

@Injectable()
export class DivisionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<DivisionItem[]> {
    return CANONICAL_DIVISIONS;
  }

  async findOne(id: string): Promise<DivisionItem | null> {
    return CANONICAL_DIVISIONS.find(d => d.id === id || d.code === id) || null;
  }
}

