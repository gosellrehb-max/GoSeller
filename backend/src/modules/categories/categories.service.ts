import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { ApiException } from '../../common/exceptions/api.exception';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async findAll(page = 1, limit = 20, search?: string, parentId?: string) {
    const query: Record<string, unknown> = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (parentId !== undefined) query.parentId = parentId === 'null' ? null : parentId;

    const [categories, total] = await Promise.all([
      this.categoryModel
        .find(query)
        .populate('parentId', 'name')
        .sort({ name: 1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean()
        .exec(),
      this.categoryModel.countDocuments(query).exec(),
    ]);
    return { categories, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<CategoryDocument | null> {
    return this.categoryModel.findById(id).populate('parentId', 'name').exec();
  }

  async create(data: Partial<Category> & { parentId?: string | null }): Promise<CategoryDocument> {
    const createData: Partial<Category> = { ...data };
    if (typeof (data as { parentId?: string }).parentId === 'string') {
      const pid = (data as { parentId: string }).parentId;
      (createData as { parentId?: Types.ObjectId | null }).parentId = pid ? new Types.ObjectId(pid) : null;
    }
    const existing = await this.categoryModel.findOne({
      name: new RegExp(`^${(data.name || '').trim()}$`, 'i'),
    }).exec();
    if (existing) throw ApiException.conflict('Category with this name already exists');
    const category = new this.categoryModel(createData);
    return category.save();
  }

  async updateById(id: string, data: Partial<Category>): Promise<CategoryDocument | null> {
    return this.categoryModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  async deleteById(id: string): Promise<void> {
    const result = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!result) throw ApiException.notFound('Category not found');
  }
}
