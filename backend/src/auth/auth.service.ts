import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private email: EmailService,
  ) {}

  // =========================================================
  // LOGIN (supports .env admin + database users)
  // =========================================================
  async login(email: string, password: string) {
    if (!email || !password) throw new UnauthorizedException('Missing credentials');

    const normalizedEmail = email.trim().toLowerCase();

    // ============================================================
    // SPECIAL CASE: Environment-based admin login
    // If ADMIN_EMAIL + ADMIN_PASSWORD in .env match, log in as Admin
    // regardless of whether the DB has the user yet.
    // ============================================================
    const envAdminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const envAdminPassword = process.env.ADMIN_PASSWORD || '';

    if (
      envAdminEmail &&
      envAdminPassword &&
      normalizedEmail === envAdminEmail &&
      password === envAdminPassword
    ) {
      // Find or create the admin user in the DB
      let adminUser = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!adminUser) {
        // First-time env-admin login → create the DB record
        const hashed = await bcrypt.hash(envAdminPassword, 10);
        adminUser = await this.prisma.user.create({
          data: {
            email: normalizedEmail,
            password: hashed,
            firstName: 'Super',
            lastName: 'Admin',
            role: 'ADMIN',
            status: 'ACTIVE',
            activatedAt: new Date(),
            settings: {
              create: { primaryColor: '#1a73e8' },
            },
          },
        });
      } else if (adminUser.role !== 'ADMIN' || adminUser.status !== 'ACTIVE') {
        // Ensure admin privileges are always active for env credentials
        adminUser = await this.prisma.user.update({
          where: { id: adminUser.id },
          data: { role: 'ADMIN', status: 'ACTIVE' },
        });
      }

      const { password: _, ...safe } = adminUser;
      return { user: safe, token: this.signToken(adminUser.id, 'ADMIN') };
    }

    // ============================================================
    // NORMAL FLOW: Database-based login for all other users
    // ============================================================
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.password) throw new UnauthorizedException('Account not activated');
    if (user.status === 'PENDING') {
      throw new UnauthorizedException('Please activate your account first (check your email)');
    }
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const { password: _, ...safe } = user;
    return { user: safe, token: this.signToken(user.id, user.role) };
  }

  // =========================================================
  // CREATE USER (Admin → any role, Supervisor → STAFF only)
  // =========================================================
  async createUser(
    creator: { id: string; role: string; firstName: string; lastName: string },
    body: {
      email: string;
      firstName: string;
      lastName: string;
      role: 'ADMIN' | 'SUPERVISOR' | 'STAFF';
      phone?: string;
      group?: string;
    },
  ) {
    // Role restriction
    if (creator.role === 'SUPERVISOR' && body.role !== 'STAFF') {
      throw new ForbiddenException('Supervisors can only create STAFF users');
    }
    if (creator.role === 'STAFF') {
      throw new ForbiddenException('Staff cannot create users');
    }

    if (!body.email || !body.firstName || !body.lastName || !body.role) {
      throw new BadRequestException('email, firstName, lastName, and role are required');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email already registered');

    // Generate activation token (64-hex chars)
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await this.prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        password: '', // empty until activation
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role,
        status: 'PENDING',
        phone: body.phone ?? null,
        group: body.group ?? null,
        createdById: creator.id,
        activationToken,
        activationExpires,
        settings: {
          create: { primaryColor: '#1a73e8' },
        },
      },
    });

    // Send activation email (don't fail the whole request if email fails)
    try {
      await this.email.sendActivationEmail({
        to: user.email,
        firstName: user.firstName,
        role: user.role,
        token: activationToken,
        invitedByName: `${creator.firstName} ${creator.lastName}`,
      });
    } catch (err) {
      console.error('❌ Email send failed:', err);
    }

    const { password, activationToken: _, activationExpires: __, ...safe } = user;
    return {
      user: safe,
      message: 'User created. Activation email sent.',
    };
  }

  // =========================================================
  // LIST USERS (Admin → all, Supervisor → their STAFF)
  // =========================================================
  async listUsers(requester: { id: string; role: string }) {
    if (requester.role === 'STAFF') {
      throw new ForbiddenException('Staff cannot list users');
    }

    const where =
      requester.role === 'SUPERVISOR'
        ? { createdById: requester.id, role: 'STAFF' as const }
        : {};

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        phone: true,
        group: true,
        createdAt: true,
        activatedAt: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =========================================================
  // RESEND ACTIVATION EMAIL
  // =========================================================
  async resendActivation(userId: string, requester: { id: string; role: string }) {
    if (requester.role === 'STAFF') {
      throw new ForbiddenException('Staff cannot resend activations');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.status === 'ACTIVE') {
      throw new BadRequestException('User is already activated');
    }

    if (requester.role === 'SUPERVISOR' && user.createdById !== requester.id) {
      throw new ForbiddenException('You can only resend to users you created');
    }

    const newToken = crypto.randomBytes(32).toString('hex');
    const newExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: userId },
      data: { activationToken: newToken, activationExpires: newExpires },
    });

    // Find the creator for the email context
    const creator = user.createdById
      ? await this.prisma.user.findUnique({ where: { id: user.createdById } })
      : null;

    try {
      await this.email.sendActivationEmail({
        to: user.email,
        firstName: user.firstName,
        role: user.role,
        token: newToken,
        invitedByName: creator ? `${creator.firstName} ${creator.lastName}` : 'TrainerMatrix',
      });
    } catch (err) {
      console.error('❌ Email resend failed:', err);
      throw new BadRequestException('Failed to send email. Check SMTP config.');
    }

    return { success: true, message: 'Activation email resent' };
  }

  // =========================================================
  // VERIFY ACTIVATION TOKEN (for frontend pre-check)
  // =========================================================
  async verifyActivationToken(token: string) {
    if (!token) return { valid: false, message: 'No token provided' };

    const user = await this.prisma.user.findUnique({
      where: { activationToken: token },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        activationExpires: true,
      },
    });

    if (!user) return { valid: false, message: 'Invalid activation link' };
    if (user.status === 'ACTIVE') return { valid: false, message: 'Account already activated' };
    if (user.activationExpires && user.activationExpires < new Date()) {
      return { valid: false, message: 'Activation link has expired' };
    }

    return {
      valid: true,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }

  // =========================================================
  // ACTIVATE (set password using token)
  // =========================================================
  async activate(token: string, newPassword: string, confirmPassword: string) {
    if (!token) throw new BadRequestException('Activation token is required');
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.prisma.user.findUnique({
      where: { activationToken: token },
    });
    if (!user) throw new BadRequestException('Invalid activation link');
    if (user.activationExpires && user.activationExpires < new Date()) {
      throw new BadRequestException('Activation link has expired');
    }
    if (user.status === 'ACTIVE') {
      throw new BadRequestException('Account already activated');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        status: 'ACTIVE',
        activationToken: null,
        activationExpires: null,
        activatedAt: new Date(),
      },
    });

    const { password, activationToken: _, activationExpires: __, ...safe } = updated;
    return { user: safe, message: 'Account activated. You can now log in.' };
  }

  // =========================================================
  // ME (current user)
  // =========================================================
  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    });
    if (!user) throw new UnauthorizedException('User not found');
    const { password, activationToken, activationExpires, ...safe } = user;
    return safe;
  }

  // =========================================================
  // Helper
  // =========================================================
  private signToken(userId: string, role: string) {
    return this.jwt.sign({ sub: userId, role });
  }
}