-- One-time fix: strip hard-coded hosts from stored upload paths.
-- Safe to run multiple times.

UPDATE banners
SET image_url = regexp_replace(
  image_url,
  '^https?://[^/]+(/v1/uploads/raw/)',
  '\1'
)
WHERE image_url ~ '^https?://[^/]+/v1/uploads/raw/';

UPDATE categories
SET icon_key = regexp_replace(
  icon_key,
  '^https?://[^/]+(/v1/uploads/raw/)',
  '\1'
)
WHERE icon_key ~ '^https?://[^/]+/v1/uploads/raw/';

UPDATE services
SET icon_key = regexp_replace(
  icon_key,
  '^https?://[^/]+(/v1/uploads/raw/)',
  '\1'
)
WHERE icon_key ~ '^https?://[^/]+/v1/uploads/raw/';

UPDATE services
SET image_key = regexp_replace(
  image_key,
  '^https?://[^/]+(/v1/uploads/raw/)',
  '\1'
)
WHERE image_key ~ '^https?://[^/]+/v1/uploads/raw/';
