import { applyDecorators } from '@nestjs/common';
import { Matches, ValidationOptions } from 'class-validator';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Looser UUID validator that accepts any syntactically valid UUID string,
 * including non-RFC4122 versions (e.g. the deterministic `00000000-...`
 * IDs used in our seed fixtures). Postgres' `uuid` type accepts all of
 * these, so the API surface should too.
 */
export function IsUuidLoose(options?: ValidationOptions) {
  return applyDecorators(
    Matches(UUID_REGEX, {
      message: ({ property }) => `${property} must be a UUID`,
      ...options,
    }),
  );
}
