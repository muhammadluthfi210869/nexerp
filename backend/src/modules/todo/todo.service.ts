import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import {
  CreateBoardDto,
  UpdateBoardDto,
  CreateTaskDto,
  UpdateTaskStatusDto,
} from './dto/todo.dto';

@Injectable()
export class TodoService {
  constructor(private prisma: PrismaService) {}

  async createBoard(dto: CreateBoardDto, createdById?: string) {
    return this.prisma.taskBoard.create({
      data: {
        name: dto.name,
        color: dto.color || '#3B82F6',
        createdById: createdById || '00000000-0000-0000-0000-000000000000',
      },
    });
  }

  async getBoards() {
    return this.prisma.taskBoard.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getBoard(id: string) {
    const board = await this.prisma.taskBoard.findUnique({
      where: { id },
    });
    if (!board) throw new NotFoundException('Board not found');

    const tasks = await this.prisma.taskItem.findMany({
      where: { boardId: id },
      orderBy: { order: 'asc' },
    });

    return { ...board, tasks };
  }

  async updateBoard(id: string, dto: UpdateBoardDto) {
    const board = await this.prisma.taskBoard.findUnique({ where: { id } });
    if (!board) throw new NotFoundException('Board not found');
    return this.prisma.taskBoard.update({ where: { id }, data: dto });
  }

  async deleteBoard(id: string) {
    await this.prisma.taskItem.deleteMany({ where: { boardId: id } });
    return this.prisma.taskBoard.delete({ where: { id } });
  }

  async createTask(boardId: string, dto: CreateTaskDto) {
    const board = await this.prisma.taskBoard.findUnique({
      where: { id: boardId },
    });
    if (!board) throw new NotFoundException('Board not found');

    const maxOrder = await this.prisma.taskItem.aggregate({
      where: { boardId },
      _max: { order: true },
    });

    return this.prisma.taskItem.create({
      data: {
        boardId,
        title: dto.title,
        description: dto.description,
        status: dto.status || 'TODO',
        assigneeId: dto.assigneeId,
        labels: dto.labels || [],
        order: (maxOrder._max.order || 0) + 1,
      },
    });
  }

  async updateTaskStatus(taskId: string, dto: UpdateTaskStatusDto) {
    const task = await this.prisma.taskItem.findUnique({
      where: { id: taskId },
    });
    if (!task) throw new NotFoundException('Task not found');
    return this.prisma.taskItem.update({
      where: { id: taskId },
      data: { status: dto.status },
    });
  }

  async deleteTask(taskId: string) {
    return this.prisma.taskItem.delete({ where: { id: taskId } });
  }
}
