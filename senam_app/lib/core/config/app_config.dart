import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static String get apiBaseUrl =>
      dotenv.env['API_BASE_URL'] ?? 'https://senam.tech';

  static String get defaultLocale => dotenv.env['DEFAULT_LOCALE'] ?? 'ar';
}
