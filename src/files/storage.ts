import { uuid } from 'uuidv4';
import { diskStorage } from 'multer';
import * as path from 'path';

const normalizeFileName = (file: Express.Multer.File) => {
  const normalizedName = file.originalname.split('.').pop();

  return normalizedName;
};

export const fileStorage = diskStorage({
  destination: path.resolve('uploads'),
  filename: (req, file, callback) =>
    callback(null, `${uuid()}.${normalizeFileName(file)}`),
});
