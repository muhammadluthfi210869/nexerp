import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUrl,
  IsISO8601,
  IsNumber,
  IsDateString,
  MaxLength,
  MinLength,
  IsIn,
  ArrayMaxSize,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTaskDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  projectId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  project?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  channel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  category?: string;

  @IsOptional()
  @IsIn(['Dreamlab', 'Toribio'])
  brand?: 'Dreamlab' | 'Toribio';

  @IsOptional()
  @IsIn(['Low', 'Medium', 'High', 'Urgent'])
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';

  @IsOptional()
  @IsIn([
    'Not started',
    'Working on it',
    'Progress',
    'In Progress',
    'Revision',
    'Done',
  ])
  status?:
    | 'Not started'
    | 'Working on it'
    | 'Progress'
    | 'In Progress'
    | 'Revision'
    | 'Done';

  @IsOptional()
  @IsIn(['Healthy', 'Watch', 'Late'])
  sla?: 'Healthy' | 'Watch' | 'Late';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  pic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  assignedBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  reviewer?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  startDate?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @IsOptional()
  @IsNumber()
  actualHours?: number;

  @IsOptional()
  @IsNumber()
  revisionCount?: number;

  @IsOptional()
  @IsNumber()
  checklistDone?: number;

  @IsOptional()
  @IsNumber()
  checklistTotal?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  brief?: string;

  @IsOptional()
  @ValidateIf((o) => typeof o.link === 'string' && o.link.trim().length > 0)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === ''
      ? undefined
      : typeof value === 'string'
        ? value.trim()
        : value,
  )
  link?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v: any) => (typeof v === 'string' ? v.trim() : v))
      : value,
  )
  tags?: string[];

  @IsOptional()
  @IsArray()
  // Diabaikan oleh service (createTask selalu `attachments: []`; updateTask tidak
  // menerima `attachments` di whitelist — BUG-A-02). Tipe longgar agar kompatibel.
  attachments?: any[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  notes?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  projectId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  project?: string;

  @IsOptional()
  @IsIn(['Dreamlab', 'Toribio'])
  brand?: 'Dreamlab' | 'Toribio';

  @IsOptional()
  @IsIn(['Low', 'Medium', 'High', 'Urgent'])
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';

  @IsOptional()
  @IsIn([
    'Not started',
    'Working on it',
    'Progress',
    'In Progress',
    'Revision',
    'Done',
  ])
  status?:
    | 'Not started'
    | 'Working on it'
    | 'Progress'
    | 'In Progress'
    | 'Revision'
    | 'Done';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  pic?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  startDate?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  brief?: string;

  @IsOptional()
  @ValidateIf((o) => typeof o.link === 'string' && o.link.trim().length > 0)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === ''
      ? undefined
      : typeof value === 'string'
        ? value.trim()
        : value,
  )
  link?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  notes?: string;
}

export class UpdateTaskStatusDto {
  @IsIn([
    'Not started',
    'Working on it',
    'Progress',
    'In Progress',
    'Revision',
    'Done',
  ])
  status!:
    | 'Not started'
    | 'Working on it'
    | 'Progress'
    | 'In Progress'
    | 'Revision'
    | 'Done';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  note?: string;
}

export class CreateTaskCommentDto {
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  author!: string;

  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  body!: string;
}

export class CreateProjectDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  channel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  owner?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  start?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  deadline?: string;

  @IsOptional()
  @IsNumber()
  progress?: number;

  @IsOptional()
  @IsIn(['On Track', 'At Risk', 'Review', 'Completed'])
  status?: 'On Track' | 'At Risk' | 'Review' | 'Completed';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  summary?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v: any) => (typeof v === 'string' ? v.trim() : v))
      : value,
  )
  blockers?: string[];
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  channel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  owner?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  start?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  deadline?: string;

  @IsOptional()
  @IsNumber()
  progress?: number;

  @IsOptional()
  @IsIn(['On Track', 'At Risk', 'Review', 'Completed'])
  status?: 'On Track' | 'At Risk' | 'Review' | 'Completed';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  summary?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v: any) => (typeof v === 'string' ? v.trim() : v))
      : value,
  )
  blockers?: string[];
}

export class UpdateSettingsDto {
  @IsOptional()
  weights?: {
    completion?: number;
    discipline?: number;
    quality?: number;
    productivity?: number;
  };

  @IsOptional()
  workingHours?: {
    start?: string;
    end?: string;
    days?: string[];
  };
}
