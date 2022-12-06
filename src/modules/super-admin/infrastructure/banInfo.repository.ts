import { BanInfoModel } from './entity/banInfo.model';
import { BanInfoScheme } from './entity/banInfo.scheme';
import { Injectable } from '@nestjs/common';
import { BanUserDTO } from "../api/dto/ban-user.dto";

@Injectable()
export class BanInfoRepository {
  async getBanInfo(id: string): Promise<any> {
    return BanInfoScheme.findOne({ id }, { _id: false, id: false, __v: false });
  }

  async createBanInfo(banInfo: BanInfoModel) {
    try {
      await BanInfoScheme.create(banInfo);
      return banInfo;
    } catch (e) {
      return null;
    }
  }

  async updateBanStatus(id: string, dto: BanUserDTO, banDate: Date): Promise<boolean> {
    const result = await BanInfoScheme.updateOne({id}, {$set: {isBanned: dto.isBanned, banReason: dto.banReason, banDate}})

    return result.matchedCount === 1
  }

  async deleteBanInfoById(id: string): Promise<boolean> {
    const result = await BanInfoScheme.deleteOne({ id });

    return result.deletedCount === 1;
  }
}