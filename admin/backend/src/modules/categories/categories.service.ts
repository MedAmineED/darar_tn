import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResult } from '../../common/interfaces/api-response.interface';
import { buildPaginatedResult } from '../../common/utils/paginate';
import { slugify } from '../../common/utils/slugify';
import { STORAGE_PROVIDER, StorageProvider } from '../storage/storage.types';
import {
  CategoriesRepository,
  CategoryWithMeta,
} from './categories.repository';
import { CategoryResponse, toCategoryResponse } from './category.mapper';
import { CategoryQueryDto } from './dto/category-query.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export interface CategoryTreeNode extends CategoryResponse {
  children: CategoryTreeNode[];
}

/** An uploaded file as delivered by Multer (memory storage). */
export interface UploadedCategoryImage {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

const SORTABLE = new Set(['sortOrder', 'nameFr', 'nameAr', 'createdAt']);
const IMAGE_FOLDER = 'categories';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly repository: CategoriesRepository,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  /** Stores a category image and returns its public URL (set via `image`). */
  async uploadImage(
    file: UploadedCategoryImage | undefined,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException({
        message: 'No image file was provided',
        code: 'NO_FILE',
      });
    }
    const stored = await this.storage.save(file.buffer, {
      folder: IMAGE_FOLDER,
      originalName: file.originalname,
      mimeType: file.mimetype,
    });
    return { url: stored.url };
  }

  async create(dto: CreateCategoryDto): Promise<CategoryResponse> {
    if (dto.parentId) {
      await this.ensureExists(dto.parentId);
    }
    const slug = await this.uniqueSlug(dto.slug ?? dto.nameFr);
    const category = await this.repository.create({
      nameAr: dto.nameAr,
      nameFr: dto.nameFr,
      slug,
      descriptionAr: dto.descriptionAr,
      descriptionFr: dto.descriptionFr,
      image: dto.image,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
      parent: dto.parentId ? { connect: { id: dto.parentId } } : undefined,
    });
    return toCategoryResponse(category);
  }

  async findAll(
    query: CategoryQueryDto,
  ): Promise<PaginatedResult<CategoryResponse>> {
    const where: Prisma.CategoryWhereInput = {};
    if (query.search) {
      where.OR = [
        { nameAr: { contains: query.search } },
        { nameFr: { contains: query.search } },
        { slug: { contains: query.search } },
      ];
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }
    if (query.parentId) {
      where.parentId = query.parentId === 'root' ? null : query.parentId;
    }

    const sortBy = SORTABLE.has(query.sortBy ?? '')
      ? (query.sortBy as string)
      : 'sortOrder';
    const orderBy: Prisma.CategoryOrderByWithRelationInput[] =
      sortBy === 'sortOrder'
        ? [{ sortOrder: query.sortOrder }, { nameFr: 'asc' }]
        : [{ [sortBy]: query.sortOrder }];

    const [items, total] = await this.repository.findMany({
      skip: query.skip,
      take: query.limit,
      where,
      orderBy,
    });
    return buildPaginatedResult(
      items.map(toCategoryResponse),
      total,
      query.page,
      query.limit,
    );
  }

  /** Full nested tree, ordered by sortOrder then name. */
  async findTree(): Promise<CategoryTreeNode[]> {
    const all = await this.repository.findAllOrdered();
    const nodes = new Map<string, CategoryTreeNode>();
    all.forEach((c) =>
      nodes.set(c.id, { ...toCategoryResponse(c), children: [] }),
    );
    const roots: CategoryTreeNode[] = [];
    for (const category of all) {
      const node = nodes.get(category.id)!;
      if (category.parentId && nodes.has(category.parentId)) {
        nodes.get(category.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  async findOne(id: string): Promise<CategoryResponse> {
    return toCategoryResponse(await this.ensureExists(id));
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponse> {
    const current = await this.ensureExists(id);

    if (dto.parentId !== undefined && dto.parentId !== current.parentId) {
      await this.validateParentChange(id, dto.parentId);
    }

    const data: Prisma.CategoryUpdateInput = {
      nameAr: dto.nameAr,
      nameFr: dto.nameFr,
      descriptionAr: dto.descriptionAr,
      descriptionFr: dto.descriptionFr,
      image: dto.image,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
    };

    if (dto.slug !== undefined) {
      data.slug = await this.uniqueSlug(dto.slug || current.nameFr, id);
    }
    if (dto.parentId !== undefined) {
      data.parent = dto.parentId
        ? { connect: { id: dto.parentId } }
        : { disconnect: true };
    }

    return toCategoryResponse(await this.repository.update(id, data));
  }

  async remove(id: string): Promise<{ id: string }> {
    const category = await this.ensureExists(id);
    if (category._count.children > 0) {
      throw new BadRequestException({
        message: 'Cannot delete a category that has sub-categories',
        code: 'CATEGORY_HAS_CHILDREN',
      });
    }
    await this.repository.delete(id);
    return { id };
  }

  private async ensureExists(id: string): Promise<CategoryWithMeta> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundException({
        message: 'Category not found',
        code: 'CATEGORY_NOT_FOUND',
      });
    }
    return category;
  }

  private async validateParentChange(
    id: string,
    parentId: string | undefined,
  ): Promise<void> {
    if (!parentId) return;
    if (parentId === id) {
      throw new BadRequestException({
        message: 'A category cannot be its own parent',
        code: 'CATEGORY_INVALID_PARENT',
      });
    }
    await this.ensureExists(parentId);
    const subtree = await this.repository.collectSubtreeIds(id);
    if (subtree.has(parentId)) {
      throw new BadRequestException({
        message: 'Cannot move a category under one of its descendants',
        code: 'CATEGORY_CYCLE',
      });
    }
  }

  private async uniqueSlug(
    source: string,
    excludeId?: string,
  ): Promise<string> {
    const base = slugify(source) || 'category';
    let candidate = base;
    let suffix = 2;
    // Loop until we find a slug not used by a different record.
    for (;;) {
      const existing = await this.repository.findBySlug(candidate);
      if (!existing || existing.id === excludeId) {
        return candidate;
      }
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
  }
}
