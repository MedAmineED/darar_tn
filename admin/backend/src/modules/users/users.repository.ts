import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Prisma include that resolves a user's roles and their permissions. */
export const userWithRolesInclude = {
  roles: {
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

export type UserWithRoles = Prisma.UserGetPayload<{
  include: typeof userWithRolesInclude;
}>;

/**
 * Thin data-access layer for users. Keeps Prisma specifics out of the service
 * and makes the query shapes reusable (auth + user management share them).
 */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: userWithRolesInclude,
    });
  }

  findById(id: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: userWithRolesInclude,
    });
  }

  async findMany(params: {
    skip: number;
    take: number;
    where: Prisma.UserWhereInput;
    orderBy: Prisma.UserOrderByWithRelationInput;
  }): Promise<[UserWithRoles[], number]> {
    return this.prisma.$transaction([
      this.prisma.user.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: params.orderBy,
        include: userWithRolesInclude,
      }),
      this.prisma.user.count({ where: params.where }),
    ]);
  }

  create(
    data: Prisma.UserCreateInput,
    roleIds: string[],
  ): Promise<UserWithRoles> {
    return this.prisma.user.create({
      data: {
        ...data,
        roles: {
          create: roleIds.map((roleId) => ({
            role: { connect: { id: roleId } },
          })),
        },
      },
      include: userWithRolesInclude,
    });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<UserWithRoles> {
    return this.prisma.user.update({
      where: { id },
      data,
      include: userWithRolesInclude,
    });
  }

  async replaceRoles(id: string, roleIds: string[]): Promise<UserWithRoles> {
    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId: id } }),
      this.prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({ userId: id, roleId })),
        skipDuplicates: true,
      }),
    ]);
    return this.findById(id) as Promise<UserWithRoles>;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  updatePassword(id: string, passwordHash: string): Promise<{ id: string }> {
    return this.prisma.user.update({
      where: { id },
      data: { password: passwordHash },
      select: { id: true },
    });
  }

  touchLastLogin(id: string): Promise<{ id: string }> {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
      select: { id: true },
    });
  }

  /** Sets a new password hash and revokes every refresh token (all sessions). */
  async setPassword(id: string, passwordHash: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { password: passwordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async revokeSessions(id: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
