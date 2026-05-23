import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddressEntity } from './entities/address.entity.js';
import { CreateAddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';

const QATAR_LAT_MIN = 24.0;
const QATAR_LAT_MAX = 26.5;
const QATAR_LNG_MIN = 50.5;
const QATAR_LNG_MAX = 51.8;

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(AddressEntity)
    private readonly addressRepository: Repository<AddressEntity>,
  ) {}

  private validateQatarBounds(lat: number, lng: number): void {
    if (
      lat < QATAR_LAT_MIN ||
      lat > QATAR_LAT_MAX ||
      lng < QATAR_LNG_MIN ||
      lng > QATAR_LNG_MAX
    ) {
      throw new BadRequestException(
        'location_out_of_bounds: coordinates must be within Qatar',
      );
    }
  }

  async findAll(userId: string): Promise<AddressEntity[]> {
    return this.addressRepository.find({ where: { userId } });
  }

  async create(
    userId: string,
    dto: CreateAddressDto,
  ): Promise<AddressEntity> {
    this.validateQatarBounds(dto.lat, dto.lng);

    const address = this.addressRepository.create({
      userId,
      label: dto.label ?? null,
      line: dto.line,
      area: dto.area ?? null,
      city: dto.city ?? null,
      latitude: dto.lat,
      longitude: dto.lng,
      accessNotes: dto.accessNotes ?? null,
      isDefault: dto.isDefault ?? false,
    });

    if (address.isDefault) {
      await this.addressRepository.update({ userId }, { isDefault: false });
    }

    return this.addressRepository.save(address);
  }

  async findOne(userId: string, id: string): Promise<AddressEntity> {
    const address = await this.addressRepository.findOne({
      where: { id, userId },
    });
    if (!address) {
      throw new NotFoundException('address_not_found');
    }
    return address;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateAddressDto,
  ): Promise<AddressEntity> {
    const address = await this.findOne(userId, id);

    if (dto.lat !== undefined || dto.lng !== undefined) {
      const lat = dto.lat ?? address.latitude;
      const lng = dto.lng ?? address.longitude;
      this.validateQatarBounds(lat, lng);
    }

    if (dto.label !== undefined) address.label = dto.label;
    if (dto.line !== undefined) address.line = dto.line;
    if (dto.area !== undefined) address.area = dto.area;
    if (dto.city !== undefined) address.city = dto.city;
    if (dto.lat !== undefined) address.latitude = dto.lat;
    if (dto.lng !== undefined) address.longitude = dto.lng;
    if (dto.accessNotes !== undefined) address.accessNotes = dto.accessNotes;
    if (dto.isDefault !== undefined) {
      if (dto.isDefault) {
        await this.addressRepository.update({ userId }, { isDefault: false });
      }
      address.isDefault = dto.isDefault;
    }

    return this.addressRepository.save(address);
  }

  async remove(userId: string, id: string): Promise<void> {
    const address = await this.findOne(userId, id);
    await this.addressRepository.remove(address);
  }

  async setDefault(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.addressRepository.update({ userId }, { isDefault: false });
    await this.addressRepository.update({ id, userId }, { isDefault: true });
  }
}
