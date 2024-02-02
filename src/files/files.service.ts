import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity } from './entities/file.entity';
import { In, Repository } from 'typeorm';
import { FileType } from './types/FileType.type';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private repository: Repository<FileEntity>,
  ) {}

  async create(file: Express.Multer.File, id: number) {
    const created = await this.repository.save({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      user: {
        id,
      },
    });
    return created;
  }

  findAll(id: number, type?: FileType) {
    const qb = this.repository.createQueryBuilder('files');

    qb.where('files.userId = :userId', { userId: id });

    if (type === FileType.IMAGE) {
      qb.andWhere('files.mimetype LIKE :mimetype', { mimetype: '%image%' });
    } else if (type === FileType.TRASH) {
      qb.withDeleted();
      qb.andWhere('files.deleteAt IS NOT NULL');
    }

    return qb.getMany();
  }

  async findOne(id: number, userId: number) {
    const file = await this.repository.findOne({
      where: { id },
    });
    if (!file) throw new NotFoundException();
    if (file.user.id !== userId) throw new ForbiddenException();
    return file;
  }

  async remove(ids: number[], userId: number) {
    const qb = this.repository
      .createQueryBuilder('files')
      .where('userId = :userId', { userId })
      .andWhere('deleteAt IS null')
      .andWhere('id IN (:...ids)', {
        ids,
      });
    const qbDeleted = this.repository
      .createQueryBuilder('files')
      .where('userId = :userId', { userId })
      .andWhere('deleteAt IS NOT null')
      .andWhere('id IN (:...ids)', {
        ids,
      });
    const deleted = this.repository.find({
      where: {
        id: In(ids),
        user: {
          id: userId,
        },
      },
    });
    deleted.then((data: FileEntity[]) => {
      data.forEach((elem) => {
        fs.rmSync(path.resolve('uploads', elem.filename));
      });
    });
    const [soft, hard] = await Promise.all([
      qb.softDelete().execute(),
      qbDeleted.delete().execute(),
    ]);
    return [...soft.raw, ...hard.raw];
  }
}
