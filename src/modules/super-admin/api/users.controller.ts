import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post, Put,
  Query,
  UseGuards
} from "@nestjs/common";
import { AuthBasicGuard } from '../../../guards/auth.basic.guard';
import { UsersService } from '../application/users.service';
import { QueryParametersDTO } from '../../../global-model/query-parameters.dto';
import { UserDTO } from './dto/userDTO';
import { UserViewModel } from './dto/userView.model';
import { BanUserDTO } from "./dto/ban-user.dto";

@UseGuards(AuthBasicGuard)
@Controller('sa/users')
export class UsersController {
  constructor(protected usersService: UsersService) {}

  @Get()
  getUsers(
    @Query()
    query: QueryParametersDTO,
  ) {
    return this.usersService.getUsers(query);
  }

  @Post()
  @HttpCode(201)
  async createUser(@Body() dto: UserDTO): Promise<UserViewModel> {
    const result = await this.usersService.createUser(dto);

    return result.user;
  }

  @Put(':id/ban')
  @HttpCode(204)
  async updateBanStatus(@Body() dto: BanUserDTO,
                @Param('id') id: string) {
    return await this.usersService.updateBanStatus(id, dto)
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteUsersById(@Param('id') userId: string) {
    const result = await this.usersService.deleteUserById(userId);

    if (!result) {
      throw new NotFoundException();
    }

    return;
  }
}
