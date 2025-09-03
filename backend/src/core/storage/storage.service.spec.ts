/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Storage, File } from '@google-cloud/storage';
import { StorageService } from './storage.service';
import { FileMetadata } from './schemas/file-metadata.schema';
import { Readable } from 'stream';

// Define the multer file interface for testing purposes
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
  stream: Readable;
}

jest.mock('@google-cloud/storage');

describe('StorageService', () => {
  let service: StorageService;
  let mockStorage: DeepMocked<Storage>;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: { [key: string]: string } = {
        GOOGLE_CLOUD_PROJECT_ID: 'test-project',
        GOOGLE_CLOUD_CLIENT_EMAIL: 'test@test.com',
        GOOGLE_CLOUD_PRIVATE_KEY: 'test-key',
        GOOGLE_CLOUD_STORAGE_BUCKET: 'test-bucket',
      };
      return config[key];
    }),
  };

  const mockFile = {
    save: jest.fn().mockResolvedValue(undefined),
    getSignedUrl: jest.fn().mockResolvedValue(['https://test-url.com']),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  const mockBucket = {
    file: jest.fn().mockReturnValue(mockFile),
  };

  const mockFileModel = Object.assign(
    jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({
        _id: 'test-id',
        ...data,
      }),
    })),
    {
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
      find: jest.fn(),
    },
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getModelToken(FileMetadata.name),
          useValue: mockFileModel,
        },
        {
          provide: Storage,
          useValue: {
            bucket: jest.fn().mockReturnValue(mockBucket),
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    mockStorage = module.get(Storage);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload a file and return metadata', async () => {
      const multerFile: MulterFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        fieldname: 'file',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: new Readable(),
      };
      const mockMetadata = {
        _id: 'test-id',
        filename: expect.stringMatching(/test-\d+-[a-f0-9]+\.jpg/),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        url: 'https://test-url.com',
        bucket: 'test-bucket',
        userId: undefined,
        metadata: undefined,
        tags: [],
      };

      await expect(service.uploadFile(multerFile)).resolves.toEqual(
        mockMetadata,
      );
    });
  });

  describe('getFileMetadata', () => {
    it('should return file metadata by id', async () => {
      const mockMetadata = {
        _id: 'test-id',
        filename: 'test.jpg',
      };

      mockFileModel.findById.mockResolvedValueOnce(mockMetadata);

      const result = await service.getFileMetadata('test-id');

      expect(result).toEqual(mockMetadata);
      expect(mockFileModel.findById).toHaveBeenCalledWith('test-id');
    });

    it('should throw NotFoundException when file not found', async () => {
      mockFileModel.findById.mockResolvedValueOnce(null);

      await expect(service.getFileMetadata('test-id')).rejects.toThrow();
    });
  });

  describe('deleteFile', () => {
    it('should delete file and metadata', async () => {
      const mockMetadata = {
        _id: 'test-id',
        filename: 'test.jpg',
      };

      mockFileModel.findById.mockResolvedValueOnce(mockMetadata);
      mockFileModel.findByIdAndDelete.mockResolvedValueOnce({});

      await service.deleteFile('test-id');

      expect(mockStorage.bucket).toHaveBeenCalledWith('test-bucket');
      expect(mockBucket.file).toHaveBeenCalledWith('test.jpg');
      expect(mockFile.delete).toHaveBeenCalled();
      expect(mockFileModel.findByIdAndDelete).toHaveBeenCalledWith('test-id');
    });
  });

  describe('searchFiles', () => {
    it('should search files with filters', async () => {
      const mockFiles = [{ filename: 'test1.jpg' }, { filename: 'test2.jpg' }];

      const sortMock = jest.fn().mockResolvedValue(mockFiles);
      mockFileModel.find.mockReturnValue({ sort: sortMock } as any);

      const result = await service.searchFiles({
        userId: 'user-1',
        tags: ['tag1', 'tag2'],
      });

      expect(result).toEqual(mockFiles);
      expect(mockFileModel.find).toHaveBeenCalledWith({
        userId: 'user-1',
        tags: { $all: ['tag1', 'tag2'] },
      });
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });
});

type DeepMocked<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? jest.Mock
    : DeepMocked<T[K]>;
};
