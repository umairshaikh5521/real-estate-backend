import { Context } from "hono";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export const successResponse = <T>(
  c: Context,
  data: T,
  status: number = 200,
  meta?: ApiResponse<T>["meta"]
): Response => {
  return c.json<ApiResponse<T>>(
    {
      success: true,
      data,
      ...(meta && { meta }),
    },
    status
  );
};

export const errorResponse = (
  c: Context,
  code: string,
  message: string,
  status: number = 400,
  details?: any
): Response => {
  return c.json<ApiResponse>(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    status
  );
};
