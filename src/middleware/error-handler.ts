import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export const errorHandler = (err: Error, c: Context) => {
  console.error("Error occurred:", err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return c.json<ApiError>(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: err.errors,
        },
      },
      400
    );
  }

  // Handle HTTP exceptions
  if (err instanceof HTTPException) {
    return c.json<ApiError>(
      {
        success: false,
        error: {
          code: err.message,
          message: err.message,
        },
      },
      err.status
    );
  }

  // Handle generic errors
  return c.json<ApiError>(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message:
          process.env.NODE_ENV === "production"
            ? "An unexpected error occurred"
            : err.message,
      },
    },
    500
  );
};
