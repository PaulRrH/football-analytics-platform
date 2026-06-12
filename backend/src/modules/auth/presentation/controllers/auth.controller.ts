import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../../../common/interfaces/authenticated-user.interface';
import { AuthResponseDto } from '../../application/dto/auth-response.dto';
import { AuthUserDto } from '../../application/dto/auth-user.dto';
import { LoginDto } from '../../application/dto/login.dto';
import { AuthService } from '../../application/services/auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesion y obtener un token JWT' })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener el usuario autenticado actual' })
  me(@CurrentUser() user: AuthenticatedUser): AuthUserDto {
    return this.authService.me(user);
  }
}
