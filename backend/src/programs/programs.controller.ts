import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProgramsService } from './programs.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('programs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProgramsController {
  constructor(private programs: ProgramsService) {}

  @Get()
  @Roles('ADMIN', 'SUPERVISOR', 'STAFF')
  findAll(@Request() req: any, @Query('mine') mine?: string) {
    const creatorId = mine === 'true' ? req.user.id : undefined;
    return this.programs.findAll(creatorId);
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPERVISOR', 'STAFF')
  findOne(@Param('id') id: string) { return this.programs.findOne(id); }

  @Post()
  @Roles('ADMIN', 'SUPERVISOR', 'STAFF')
  create(@Body() body: any, @Request() req: any) {
    return this.programs.create(body, req.user.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPERVISOR', 'STAFF')
  update(@Param('id') id: string, @Body() body: any) {
    return this.programs.update(id, body);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPERVISOR')
  remove(@Param('id') id: string) { return this.programs.remove(id); }
}