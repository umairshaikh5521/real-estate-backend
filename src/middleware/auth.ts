import { Context, Next } from "hono";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid authorization header",
        },
      },
      401
    );
  }

  const token = authHeader.substring(7);

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return c.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or expired token",
          },
        },
        401
      );
    }

    // Add user to context
    c.set("user", {
      id: user.id,
      email: user.email!,
      role: user.user_metadata?.role || "agent",
    } as AuthUser);

    await next();
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          code: "AUTHENTICATION_ERROR",
          message: "Failed to authenticate user",
        },
      },
      401
    );
  }
};

// Optional auth - doesn't fail if no token
export const optionalAuthMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser(token);

      if (user) {
        c.set("user", {
          id: user.id,
          email: user.email!,
          role: user.user_metadata?.role || "agent",
        } as AuthUser);
      }
    } catch (error) {
      // Silently fail for optional auth
    }
  }

  await next();
};

// Role-based access control
export const requireRole = (allowedRoles: string[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as AuthUser;

    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        401
      );
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Insufficient permissions",
          },
        },
        403
      );
    }

    await next();
  };
};
