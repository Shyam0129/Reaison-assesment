import { Response } from "express";
import { ApiResponse, PaginatedResponse } from "../types/api.types";

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const body: ApiResponse<T> = { success: true, data };
  res.status(statusCode).json(body);
}

export function sendError(res: Response, message: string, statusCode = 500, error?: unknown): void {
  const body: ApiResponse<never> = { success: false, message, error };
  res.status(statusCode).json(body);
}

export function sendPaginated<T>(
  res: Response,
  result: PaginatedResponse<T>,
  statusCode = 200
): void {
  const body: ApiResponse<PaginatedResponse<T>> = { success: true, data: result };
  res.status(statusCode).json(body);
}
