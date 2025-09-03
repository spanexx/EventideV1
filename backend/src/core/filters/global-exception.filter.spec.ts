import { GlobalExceptionFilter } from './global-exception.filter';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Response, Request } from 'express';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockHttpAdapter: any;

  beforeEach(async () => {
    // Create a mock HttpAdapter
    mockHttpAdapter = {
      reply: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [GlobalExceptionFilter],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);

    // Set the mock adapter directly since we modified the constructor
    (filter as any).httpAdapter = mockHttpAdapter;
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException correctly', () => {
    const mockResponse = {} as Response;
    const mockRequest = {} as Request;
    const exception = new BadRequestException('Invalid input');

    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;

    filter.catch(exception, mockHost);

    expect(mockHttpAdapter.reply).toHaveBeenCalledWith(
      mockResponse,
      expect.objectContaining({
        success: false,
        data: null,
        message: 'Invalid input',
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid input',
        },
        meta: expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      }),
      HttpStatus.BAD_REQUEST,
    );
  });

  it('should handle generic Error correctly', () => {
    const mockResponse = {} as Response;
    const mockRequest = {} as Request;
    const exception = new Error('Something went wrong');

    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;

    filter.catch(exception, mockHost);

    expect(mockHttpAdapter.reply).toHaveBeenCalledWith(
      mockResponse,
      expect.objectContaining({
        success: false,
        data: null,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
        meta: expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        }),
      }),
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });
});
