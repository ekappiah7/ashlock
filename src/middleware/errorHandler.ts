import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'express-validator';
import { AppError } from '../types';

export class CustomError extends Error implements AppError {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let details: any = undefined;

  // Handle validation errors
  if (error.array && typeof error.array === 'function') {
    statusCode = 400;
    message = 'Validation error';
    details = {
      errors: error.array().map((err: ValidationError) => ({
        field: err.param,
        message: err.msg,
        value: err.value,
      })),
    };
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Handle database errors
  if (error.code === '23505') {
    // Unique constraint violation
    statusCode = 409;
    message = 'Resource already exists';
    details = {
      constraint: error.constraint,
    };
  }

  if (error.code === '23503') {
    // Foreign key constraint violation
    statusCode = 400;
    message = 'Referenced resource does not exist';
  }

  if (error.code === '23502') {
    // Not null constraint violation
    statusCode = 400;
    message = 'Required field is missing';
  }

  // Handle custom errors
  if (error instanceof CustomError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new CustomError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};