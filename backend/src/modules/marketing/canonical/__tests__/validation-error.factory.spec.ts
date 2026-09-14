import { BadRequestException } from '@nestjs/common';
import { validationExceptionFactory } from '../../../../common/validation/validation-error.factory';

describe('validationExceptionFactory', () => {
  it('returns stable field errors including nested properties', () => {
    const exception = validationExceptionFactory([
      { property: 'title', constraints: { isLength: 'title is too long' }, children: [] },
      { property: 'checklist', children: [{ property: '0', children: [{ property: 'text', constraints: { isNotEmpty: 'text is required' }, children: [] }] }] },
    ] as any);
    expect(exception).toBeInstanceOf(BadRequestException);
    expect(exception.getResponse()).toMatchObject({
      code: 'VALIDATION_FAILED',
      fieldErrors: { title: ['title is too long'], 'checklist.0.text': ['text is required'] },
    });
  });
});
