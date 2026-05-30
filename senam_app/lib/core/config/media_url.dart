import 'app_config.dart';

const _uploadsRawPrefix = '/v1/uploads/raw/';

const _uploadPurposes = [
  'profile_photo',
  'kyc_document',
  'review_photo',
  'company_logo',
  'portfolio_photo',
  'banner_image',
  'category_icon',
  'service_icon',
  'service_image',
];

bool _isUploadObjectKey(String value) {
  return _uploadPurposes.any((p) => value.startsWith('$p/'));
}

String toStoredMediaPath(String value) {
  final trimmed = value.trim();
  if (trimmed.isEmpty) return trimmed;

  final uri = Uri.tryParse(trimmed);
  if (uri != null && uri.hasScheme) {
    final idx = uri.path.indexOf(_uploadsRawPrefix);
    if (idx >= 0) return uri.path.substring(idx);
    return trimmed;
  }

  if (trimmed.startsWith(_uploadsRawPrefix)) return trimmed;

  if (_isUploadObjectKey(trimmed)) {
    return '$_uploadsRawPrefix$trimmed';
  }

  return trimmed;
}

String resolveMediaUrl(String? value) {
  if (value == null || value.isEmpty) return '';
  final base = AppConfig.apiBaseUrl.replaceAll(RegExp(r'/+$'), '');
  final stored = toStoredMediaPath(value);
  if (stored.startsWith(_uploadsRawPrefix)) {
    return '$base$stored';
  }
  return value;
}
