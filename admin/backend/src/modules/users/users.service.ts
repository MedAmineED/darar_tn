import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import { buildPaginatedResult } from '../../common/utils/paginate';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { toUserResponse, UserResponse } from './user.mapper';
import { UsersRepository, UserWithRoles } from './users.repository';

const BCRYPT_ROUNDS = 12;
const SORTABLE_FIELDS = new Set<keyof Prisma.UserOrderByWithRelationInput>([
  'createdAt',
  'updatedAt',
  'firstName',
  'lastName',
  'email',
]);

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(dto: CreateUserDto): Promise<UserResponse> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException({
        message: 'Email is already in use',
        code: 'EMAIL_TAKEN',
      });
    }
    const password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersRepository.create(
      {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password,
        isActive: dto.isActive ?? true,
      },
      dto.roleIds ?? [],
    );
    return toUserResponse(user);
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<UserResponse>> {
    const where: Prisma.UserWhereInput = query.search
      ? {
          OR: [
            { firstName: { contains: query.search } },
            { lastName: { contains: query.search } },
            { email: { contains: query.search } },
          ],
        }
      : {};

    const sortBy =
      query.sortBy && SORTABLE_FIELDS.has(query.sortBy as never)
        ? query.sortBy
        : 'createdAt';

    const [users, total] = await this.usersRepository.findMany({
      skip: query.skip,
      take: query.limit,
      where,
      orderBy: { [sortBy]: query.sortOrder },
    });

    return buildPaginatedResult(
      users.map(toUserResponse),
      total,
      query.page,
      query.limit,
    );
  }

  async findOne(id: string): Promise<UserResponse> {
    const user = await this.getOrThrow(id);
    return toUserResponse(user);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    actorId?: string,
  ): Promise<UserResponse> {
    await this.getOrThrow(id);
    if (id === actorId && dto.isActive === false) throw this.selfLockout();
    const { roleIds, ...rest } = dto;

    const updated = await this.usersRepository.update(id, {
      ...rest,
    });

    const withRoles = roleIds
      ? await this.usersRepository.replaceRoles(id, roleIds)
      : updated;
    // A deactivated user loses every session immediately.
    if (dto.isActive === false) await this.usersRepository.revokeSessions(id);

    return toUserResponse(withRoles);
  }

  async assignRoles(id: string, roleIds: string[]): Promise<UserResponse> {
    await this.getOrThrow(id);
    const user = await this.usersRepository.replaceRoles(id, roleIds);
    return toUserResponse(user);
  }

  async resetPassword(id: string, password: string): Promise<{ id: string }> {
    await this.getOrThrow(id);
    await this.usersRepository.setPassword(
      id,
      await bcrypt.hash(password, BCRYPT_ROUNDS),
    );
    return { id };
  }

  async remove(id: string, actorId?: string): Promise<{ id: string }> {
    await this.getOrThrow(id);
    if (id === actorId) throw this.selfLockout();
    await this.usersRepository.delete(id);
    return { id };
  }

  private async getOrThrow(id: string): Promise<UserWithRoles> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }
    return user;
  }

  private selfLockout(): BadRequestException {
    return new BadRequestException({
      message: 'You cannot deactivate or delete your own account',
      code: 'SELF_LOCKOUT',
    });
  }
}
