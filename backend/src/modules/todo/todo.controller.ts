import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TodoService } from './todo.service';
import {
  CreateBoardDto,
  UpdateBoardDto,
  CreateTaskDto,
  UpdateTaskStatusDto,
} from './dto/todo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('todo')
@ApiBearerAuth()
@Controller('todo')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  // ─── BOARDS ───────────────────────────────────

  @Post('boards')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Create a task board' })
  createBoard(@Body() dto: CreateBoardDto, @Req() req: any) {
    return this.todoService.createBoard(dto, req.user?.userId);
  }

  @Get('boards')
  @ApiOperation({ summary: 'List all boards' })
  getBoards() {
    return this.todoService.getBoards();
  }

  @Get('boards/:id')
  @ApiOperation({ summary: 'Get board with tasks' })
  getBoard(@Param('id') id: string) {
    return this.todoService.getBoard(id);
  }

  @Patch('boards/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Update board' })
  updateBoard(@Param('id') id: string, @Body() dto: UpdateBoardDto) {
    return this.todoService.updateBoard(id, dto);
  }

  @Delete('boards/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Delete board' })
  deleteBoard(@Param('id') id: string) {
    return this.todoService.deleteBoard(id);
  }

  // ─── TASKS ────────────────────────────────────

  @Post('boards/:id/tasks')
  @ApiOperation({ summary: 'Create a task in board' })
  createTask(@Param('id') id: string, @Body() dto: CreateTaskDto) {
    return this.todoService.createTask(id, dto);
  }

  @Patch('tasks/:id/status')
  @ApiOperation({ summary: 'Update task status (drag & drop)' })
  updateTaskStatus(@Param('id') id: string, @Body() dto: UpdateTaskStatusDto) {
    return this.todoService.updateTaskStatus(id, dto);
  }

  @Delete('tasks/:id')
  @ApiOperation({ summary: 'Delete task' })
  deleteTask(@Param('id') id: string) {
    return this.todoService.deleteTask(id);
  }
}
