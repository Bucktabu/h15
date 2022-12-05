import { Injectable } from '@nestjs/common';
import { BanInfoRepository } from '../infrastructure/banInfo.repository';
import { EmailConfirmationRepository } from '../infrastructure/emailConfirmation.repository';
import { UsersRepository } from '../infrastructure/users.repository';
import { BanInfoModel } from '../infrastructure/entity/banInfo.model';
import { ContentPageModel } from '../../../global-model/contentPage.model';
import { EmailConfirmationModel } from '../infrastructure/entity/emailConfirmation.model';
import { QueryInputModel } from '../api/dto/queryInput.model';
import { UserAccountModel } from '../infrastructure/entity/userAccount.model';
import { UserDBModel } from '../infrastructure/entity/userDB.model';
import { UserDTO } from '../api/dto/userDTO';
import {
  UserViewModel,
  UserViewModelWithBanInfo,
} from '../api/dto/userView.model';
import { toCreateUserViewModel } from '../../../data-mapper/to-create-user-view.model';
import {
  _generateHash,
  paginationContentPage,
} from '../../../helper.functions';
import { v4 as uuidv4 } from 'uuid';
import add from 'date-fns/add';
import bcrypt from 'bcrypt';
import { QueryParametersDTO } from '../../../global-model/query-parameters.dto';

@Injectable()
export class UsersService {
  constructor(
    protected banInfoRepository: BanInfoRepository,
    protected emailConfirmationRepository: EmailConfirmationRepository,
    protected usersRepository: UsersRepository,
  ) {}

  async getUserByIdOrLoginOrEmail(
    IdOrLoginOrEmail: string,
  ): Promise<UserDBModel | null> {
    return this.usersRepository.getUserByIdOrLoginOrEmail(IdOrLoginOrEmail);
  }

  async getUsers(query: QueryParametersDTO): Promise<ContentPageModel> {
    const usersDB = await this.usersRepository.getUsers(query);
    const users = await Promise.all(
      usersDB.map(async (u) => await this.addBanInfo(u)),
    );
    const totalCount = await this.usersRepository.getTotalCount(
      query.searchLoginTerm,
      query.searchEmailTerm,
    );

    return paginationContentPage(
      query.pageNumber,
      query.pageSize,
      users,
      totalCount,
    );
  }

  async createUser(dto: UserDTO) {
    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await _generateHash(dto.password, passwordSalt);
    const userAccountId = uuidv4();

    const accountData = new UserDBModel(
      userAccountId,
      dto.login,
      dto.email,
      passwordSalt,
      passwordHash,
      new Date().toISOString(),
    ); // TODO попробовать избавиться от соли

    const emailConfirmation = new EmailConfirmationModel(
      userAccountId,
      uuidv4(),
      add(new Date(), { hours: 24 }),
      false,
    );

    const banInfo = new BanInfoModel(userAccountId, false, null, null);

    const userAccount = new UserAccountModel(
      accountData,
      banInfo,
      emailConfirmation,
    );

    const createdAccount = await this.createUserAccount(userAccount);

    if (!createdAccount) {
      return null;
    }

    const createdUser = toCreateUserViewModel(accountData, banInfo);

    return {
      user: createdUser,
      email: accountData.email,
      code: emailConfirmation.confirmationCode,
    };
  } // TODO избавиться от аккаунта

  async updateUserPassword(
    userId: string,
    newPassword: string,
  ): Promise<boolean> {
    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await _generateHash(newPassword, passwordSalt); //TODO вынести в отдельную функцию

    return await this.usersRepository.updateUserPassword(
      userId,
      passwordSalt,
      passwordHash,
    );
  }

  async deleteUserById(userId: string): Promise<boolean> {
    const userDeleted = await this.usersRepository.deleteUserById(userId);
    await this.banInfoRepository.deleteBanInfoById(userId);
    await this.emailConfirmationRepository.deleteEmailConfirmationById(userId);

    if (!userDeleted) {
      return false;
    }

    return true;
  }

  private async createUserAccount(
    userAccount: UserAccountModel,
  ): Promise<boolean> {
    const user = await this.usersRepository.createUser(userAccount.accountData);
    const banInfo = await this.banInfoRepository.createBanInfo(
      userAccount.banInfo,
    );
    const emailConfirmation =
      await this.emailConfirmationRepository.createEmailConfirmation(
        userAccount.emailConfirmation,
      );

    if (!user || !emailConfirmation) {
      return false;
    }

    return true;
  }

  private async addBanInfo(
    userDB: UserDBModel,
  ): Promise<UserViewModelWithBanInfo> {
    const banInfo = await this.banInfoRepository.getBanInfo(userDB.id);

    return {
      id: userDB.id,
      login: userDB.login,
      email: userDB.email,
      createdAt: userDB.createdAt,
      banInfo,
    };
  }
}
