import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static String get apiBaseUrl =>
      dotenv.env['API_BASE_URL'] ?? 'http://10.44.76.170:3000';

  static String get defaultLocale => dotenv.env['DEFAULT_LOCALE'] ?? 'ar';
}
