import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../interfaces/api-response.interface';

/**
 * Centralized error handling. Produces a consistent envelope and never leaks
 * internal database/stack details to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, code, details } = this.resolve(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status} ${code}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ApiErrorResponse = {
      success: false,
      message,
      error: { code, ...(details !== undefined ? { details } : {}) },
    };

    response.status(status).json(body);
  }

  private resolve(exception: unknown): {
    status: number;
    message: string;
    code: string;
    details?: unknown;
  } {
    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.fromPrismaError(exception);
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
    };
  }

  private fromHttpException(exception: HttpException): {
    status: number;
    message: string;
    code: string;
    details?: unknown;
  } {
    const status = exception.getStatus();
    const res = exception.getResponse();
    const code = this.statusToCode(status);

    if (typeof res === 'string') {
      return { status, message: res, code };
    }

    const obj = res as Record<string, unknown>;
    const rawMessage = obj.message;
    // class-validator returns an array of messages
    if (Array.isArray(rawMessage)) {
      return {
        status,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: rawMessage,
      };
    }
    return {
      status,
      message: typeof rawMessage === 'string' ? rawMessage : exception.message,
      code: typeof obj.code === 'string' ? obj.code : code,
    };
  }

  private fromPrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
    code: string;
  } {
    switch (exception.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: 'A record with the same unique value already exists',
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'The requested record was not found',
          code: 'RECORD_NOT_FOUND',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Related record constraint failed',
          code: 'FOREIGN_KEY_CONSTRAINT',
        };
      default:
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Database request error',
          code: 'DATABASE_ERROR',
        };
    }
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
    };
    return map[status] ?? 'ERROR';
  }
}
