import { IsString, IsOptional, IsIn, IsDateString, IsNumber, IsArray } from 'class-validator';

export class CreateTaskDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  project?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsIn(['Dreamlab', 'Toribio'])
  brand?: 'Dreamlab' | 'Toribio';

  @IsOptional()
  @IsIn(['Low', 'Medium', 'High', 'Urgent'])
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';

  @IsOptional()
  @IsIn(['Not started', 'Working on it', 'Revision', 'Done'])
  status?: 'Not started' | 'Working on it' | 'Revision' | 'Done';

  @IsOptional()
  @IsIn(['Healthy', 'Watch', 'Late'])
  sla?: 'Healthy' | 'Watch' | 'Late';

  @IsOptional()
  @IsString()
  pic?: string;

  @IsOptional()
  @IsString()
  assignedBy?: string;

  @IsOptional()
  @IsString()
  reviewer?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
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
  brief?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsArray()
  // Diabaikan oleh service (createTask selalu `attachments: []`; updateTask tidak
  // menerima `attachments` di whitelist — BUG-A-02). Tipe longgar agar kompatibel.
  attachments?: any[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  project?: string;

  @IsOptional()
  @IsIn(['Dreamlab', 'Toribio'])
  brand?: 'Dreamlab' | 'Toribio';

  @IsOptional()
  @IsIn(['Low', 'Medium', 'High', 'Urgent'])
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';

  @IsOptional()
  @IsIn(['Not started', 'Working on it', 'Revision', 'Done'])
  status?: 'Not started' | 'Working on it' | 'Revision' | 'Done';

  @IsOptional()
  @IsString()
  pic?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  brief?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTaskStatusDto {
  @IsIn(['Not started', 'Working on it', 'Revision', 'Done'])
  status!: 'Not started' | 'Working on it' | 'Revision' | 'Done';

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateTaskCommentDto {
  @IsString()
  author!: string;

  @IsString()
  body!: string;
}

export class CreateProjectDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @IsDateString()
  start?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsNumber()
  progress?: number;

  @IsOptional()
  @IsIn(['On Track', 'At Risk', 'Review', 'Completed'])
  status?: 'On Track' | 'At Risk' | 'Review' | 'Completed';

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsArray()
  blockers?: string[];
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @IsDateString()
  start?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsNumber()
  progress?: number;

  @IsOptional()
  @IsIn(['On Track', 'At Risk', 'Review', 'Completed'])
  status?: 'On Track' | 'At Risk' | 'Review' | 'Completed';

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsArray()
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
