import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TodoService } from './todo.service';
import { TodoController } from './todo.controller';

@Module({
  imports: [PrismaModule],
  providers: [TodoService],
  controllers: [TodoController],
})
export class TodoModule {}
