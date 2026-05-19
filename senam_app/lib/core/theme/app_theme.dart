import 'package:flutter/material.dart';
import 'app_colors.dart';

/// ثيم تطبيق SENAM
class AppTheme {
  AppTheme._();

  /// الخط العربي المميز للتطبيق (El Messiri).
  static const String fontFamily = 'ElMessiri';

  static ThemeData get dark {
    final base = ThemeData.dark(useMaterial3: true);
    return base.copyWith(
      scaffoldBackgroundColor: AppColors.background,
      primaryColor: AppColors.gold,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.gold,
        secondary: AppColors.goldLight,
        surface: AppColors.surface,
        error: AppColors.error,
        onPrimary: Color(0xFF1A1500),
      ),
      // تطبيق الخط العربي المميز على كل النصوص
      textTheme: base.textTheme
          .apply(
            bodyColor: AppColors.textPrimary,
            displayColor: AppColors.textPrimary,
            fontFamily: fontFamily,
          ),
      primaryTextTheme: base.primaryTextTheme.apply(fontFamily: fontFamily),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.background,
        elevation: 0,
        centerTitle: true,
        iconTheme: IconThemeData(color: AppColors.textPrimary),
        titleTextStyle: TextStyle(
          fontFamily: fontFamily,
          color: AppColors.textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
      ),
      cardTheme: const CardThemeData(
        color: AppColors.surface,
        elevation: 0,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.gold,
          foregroundColor: const Color(0xFF1A1500),
          elevation: 0,
          minimumSize: const Size.fromHeight(54),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontFamily: fontFamily,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          textStyle: const TextStyle(fontFamily: fontFamily),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          textStyle: const TextStyle(fontFamily: fontFamily),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        hintStyle: const TextStyle(
            fontFamily: fontFamily,
            color: AppColors.textMuted,
            fontSize: 14),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.gold),
        ),
      ),
      dividerColor: AppColors.border,
    );
  }
}
