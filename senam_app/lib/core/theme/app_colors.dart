import 'package:flutter/material.dart';

/// نظام الألوان لتطبيق SENAM - ثيم داكن فاخر
class AppColors {
  AppColors._();

  // الخلفيات
  static const Color background = Color(0xFF0D0D0F);
  static const Color surface = Color(0xFF1A1A1E);
  static const Color surfaceLight = Color(0xFF242429);
  static const Color surfaceHigh = Color(0xFF2E2E34);

  // اللون الذهبي (الهوية)
  static const Color gold = Color(0xFFC9A24B);
  static const Color goldLight = Color(0xFFE3C77E);
  static const Color goldDark = Color(0xFF9E7E33);

  // النصوص
  static const Color textPrimary = Color(0xFFF5F5F5);
  static const Color textSecondary = Color(0xFF9A9A9F);
  static const Color textMuted = Color(0xFF6B6B70);

  // حالات
  static const Color success = Color(0xFF4CAF7D);
  static const Color warning = Color(0xFFE0A93C);
  static const Color error = Color(0xFFE05B5B);
  static const Color info = Color(0xFF7E8FE0);

  // حدود
  static const Color border = Color(0xFF2C2C32);

  // تدرج ذهبي
  static const LinearGradient goldGradient = LinearGradient(
    colors: [goldLight, gold, goldDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFF26262C), Color(0xFF161618)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}
