import { plainToInstance } from "class-transformer";
import { validateSync, ValidationError } from "class-validator";
import type { ClassConstructor } from "class-transformer/types/interfaces";
import { ApiException } from "../exceptions/api.exception";

function flattenErrors(errors: ValidationError[], prefix = ""): string[] {
  const out: string[] = [];
  for (const e of errors) {
    const path = prefix ? `${prefix}.${e.property}` : e.property;
    if (e.constraints) {
      out.push(...Object.values(e.constraints).map((m) => `${path}: ${m}`));
    }
    if (e.children?.length) {
      out.push(...flattenErrors(e.children, path));
    }
  }
  return out;
}

/** Validate a plain object (e.g. multipart `req.body`) against a DTO class. */
export function validatePlain<T extends object>(
  cls: ClassConstructor<T>,
  plain: unknown,
): T {
  const instance = plainToInstance(cls, plain ?? {}, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(instance, {
    whitelist: true,
    forbidNonWhitelisted: false,
  });
  if (errors.length) {
    const msg = flattenErrors(errors).join("; ") || "Validation failed";
    throw ApiException.badRequest(msg);
  }
  return instance;
}
