import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  findAll(staffId?: string) {
    const where = staffId ? { staffId } : {};
    return this.prisma.profile.findMany({
      where,
      include: {
        staff: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        staff: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  create(body: any, staffId: string) {
    return this.prisma.profile.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        sex: body.sex,
        birthday: body.birthday,
        heightFt: body.heightFt ? Number(body.heightFt) : null,
        heightIn: body.heightIn ? Number(body.heightIn) : null,
        profilePhoto: body.profilePhoto,
        measurementSystem: body.measurementSystem || 'Imperial',
        clientAccess: body.clientAccess || 'deny',
        groups: body.groups || [],
        staffId,
      },
    });
  }

  async update(id: string, body: any) {
    await this.findOne(id);
    const data: any = {};
    const allowed = [
      'firstName', 'lastName', 'email', 'phone', 'sex', 'birthday',
      'heightFt', 'heightIn', 'profilePhoto', 'measurementSystem',
      'clientAccess', 'groups', 'parqStatus', 'lastTested',
      'nextGoal', 'overdueMetrics', 'status',
    ];
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    return this.prisma.profile.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.profile.delete({ where: { id } });
    return { success: true };
  }
}