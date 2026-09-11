import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

function collect(errors: ValidationError[], prefix = '', output: Record<string, string[]> = {}) {
  for (const error of errors) {
    const field = prefix ? `${prefix}.${error.property}` : error.property;
    if (error.constraints) output[field] = Object.values(error.constraints);
    if (error.children?.length) collect(error.children, field, output);
  }
  return output;
}

export function validationExceptionFactory(errors: ValidationError[]) {
  return new BadRequestException({
    code: 'VALIDATION_FAILED',
    message: 'Request validation failed.',
    fieldErrors: collect(errors),
  });
}
