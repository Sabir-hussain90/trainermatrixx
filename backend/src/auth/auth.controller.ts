import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  // =========================================================
  // LOGIN (only entry point — no signup)
  // =========================================================
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body.email, body.password);
  }

  // =========================================================
  // CREATE USER (Admin or Supervisor)
  // =========================================================
  @Post('users')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  createUser(@Body() body: any, @Request() req: any) {
    return this.auth.createUser(req.user, body);
  }

  // =========================================================
  // LIST USERS
  // =========================================================
  @Get('users')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  listUsers(@Request() req: any) {
    return this.auth.listUsers(req.user);
  }

  // =========================================================
  // RESEND ACTIVATION EMAIL
  // =========================================================
  @Post('users/:id/resend')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  resend(@Param('id') id: string, @Request() req: any) {
    return this.auth.resendActivation(id, req.user);
  }

  // =========================================================
  // VERIFY ACTIVATION TOKEN (frontend pre-check)
  // =========================================================
  @Get('verify-token')
  verifyToken(@Query('token') token: string) {
    return this.auth.verifyActivationToken(token);
  }

  // =========================================================
  // ACTIVATE ACCOUNT (set password)
  // =========================================================
  @Post('activate')
  @HttpCode(HttpStatus.OK)
  activate(
    @Body() body: { token: string; newPassword: string; confirmPassword: string },
  ) {
    return this.auth.activate(body.token, body.newPassword, body.confirmPassword);
  }

  // =========================================================
  // ME (current user)
  // =========================================================
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Request() req: any) {
    return this.auth.me(req.user.id);
  }
}