/**
 * 修改密码 DTO
 */
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { IsStrongPassword } from '../common/decorators';

export class ChangePasswordDto {
  @IsNotEmpty({ message: '当前密码不能为空' })
  @IsString({ message: '当前密码必须是字符串' })
  @MinLength(6, { message: '当前密码至少6个字符' })
  @MaxLength(128, { message: '当前密码最多128个字符' })
  currentPassword: string;

  @IsNotEmpty({ message: '新密码不能为空' })
  @IsString({ message: '新密码必须是字符串' })
  @MinLength(8, { message: '新密码至少8个字符' })
  @MaxLength(128, { message: '新密码最多128个字符' })
  @IsStrongPassword({
    message: '新密码必须至少8个字符，包含大小写字母、数字和特殊字符(@$!%*?&)',
  })
  newPassword: string;
}

