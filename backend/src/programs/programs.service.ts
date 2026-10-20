import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgramsService {
  constructor(private prisma: PrismaService) {}

  findAll(creatorId?: string) {
    const where = creatorId ? { creatorId } : {};
    return this.prisma.program.findMany({
      where,
      include: { creator: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const p = await this.prisma.program.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Program not found');
    return p;
  }

  create(body: any, creatorId: string) {
    return this.prisma.program.create({
      data: {
        name: body.name,
        description: body.description,
        weeks: Number(body.weeks) || 1,
        access: body.access || 'MYSELF',
        visibility: body.visibility || 'ALL_WORKOUTS',
        metrics: body.metrics || [],
        activities: body.activities || {},
        creatorId,
      },
    });
  }

  async update(id: string, body: any) {
    await this.findOne(id);
    return this.prisma.program.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        weeks: body.weeks !== undefined ? Number(body.weeks) : undefined,
        access: body.access,
        visibility: body.visibility,
        metrics: body.metrics,
        activities: body.activities,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.program.delete({ where: { id } });
    return { success: true };
  }
}