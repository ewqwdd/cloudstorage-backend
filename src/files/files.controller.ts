import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  UseGuards,
  Query,
  Body,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileStorage } from './storage';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { UserId } from 'src/decorators/UserId.decorator';
import { FileType } from './types/FileType.type';

@Controller('files')
@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: fileStorage,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  uploadFIle(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 1024 * 1024 * 5,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @UserId() id: number,
  ) {
    return this.filesService.create(file, id);
  }
  @ApiQuery({
    name: 'type',
    enum: FileType,
    required: false,
  })
  @Get()
  findAll(@UserId() id: number, @Query('type') type: FileType) {
    return this.filesService.findAll(id, type);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @UserId() userId: number) {
    return this.filesService.findOne(+id, userId);
  }
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          example: [1, 2, 3],
        },
      },
    },
  })
  @Delete('')
  remove(@Body('ids') ids: number[], @UserId() userId) {
    return this.filesService.remove(ids, userId);
  }
}
