import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// عناصر واجهة مشتركة قابلة لإعادة الاستخدام عبر كل الميزات.

/// خلفية متدرجة داكنة.
class DarkBackground extends StatelessWidget {
  final Widget child;
  const DarkBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: RadialGradient(
          center: Alignment.topCenter,
          radius: 1.4,
          colors: [Color(0xFF1B1A16), AppColors.background],
        ),
      ),
      child: child,
    );
  }
}

/// شعار الشركة (دائري بحرفين).
class CompanyLogo extends StatelessWidget {
  final String label;
  final Color color;
  final double size;

  const CompanyLogo({
    super.key,
    required this.label,
    required this.color,
    this.size = 56,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.28),
        gradient: LinearGradient(
          colors: [color.withValues(alpha: 0.9), color.withValues(alpha: 0.55)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        label,
        style: TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w800,
          fontSize: size * 0.34,
        ),
      ),
    );
  }
}

/// شارة التقييم بالنجوم.
class RatingBadge extends StatelessWidget {
  final double rating;
  final int? count;
  final double iconSize;

  const RatingBadge({
    super.key,
    required this.rating,
    this.count,
    this.iconSize = 15,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.star_rounded, color: AppColors.gold, size: iconSize),
        const SizedBox(width: 3),
        Text(
          rating.toStringAsFixed(1),
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w700,
            fontSize: iconSize - 2,
          ),
        ),
        if (count != null) ...[
          const SizedBox(width: 3),
          Text(
            '($count)',
            style: TextStyle(
              color: AppColors.textMuted,
              fontSize: iconSize - 3,
            ),
          ),
        ],
      ],
    );
  }
}

/// عنوان قسم مع زر "عرض الكل".
class SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback? onSeeAll;

  const SectionHeader({super.key, required this.title, this.onSeeAll});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
          ),
          if (onSeeAll != null)
            GestureDetector(
              onTap: onSeeAll,
              child: Row(
                children: const [
                  Text(
                    'عرض الكل',
                    style: TextStyle(color: AppColors.gold, fontSize: 13),
                  ),
                  Icon(Icons.chevron_left, color: AppColors.gold, size: 18),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// شارة صغيرة (Pill).
class TagPill extends StatelessWidget {
  final String text;
  final Color color;
  final IconData? icon;

  const TagPill({
    super.key,
    required this.text,
    this.color = AppColors.gold,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 13, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            text,
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

/// بطاقة بخلفية داكنة بحدود.
class GradientCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  const GradientCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(14),
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: padding,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border),
        ),
        child: child,
      ),
    );
  }
}

/// زر دائري شفاف لأشرطة التطبيق.
class CircleIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final bool showDot;
  final int? badgeCount;

  const CircleIconButton({
    super.key,
    required this.icon,
    this.onTap,
    this.showDot = false,
    this.badgeCount,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Icon(icon, color: AppColors.textPrimary, size: 20),
          ),
          if (badgeCount != null)
            Positioned(
              right: -4,
              top: -4,
              child: Container(
                constraints: const BoxConstraints(minWidth: 18),
                height: 18,
                padding: const EdgeInsets.symmetric(horizontal: 4),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.gold,
                  borderRadius: BorderRadius.circular(9),
                  border: Border.all(color: AppColors.background, width: 2),
                ),
                child: Text(
                  '$badgeCount',
                  style: const TextStyle(
                    color: Color(0xFF1A1500),
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            )
          else if (showDot)
            Positioned(
              right: -2,
              top: -2,
              child: Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: AppColors.gold,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.background, width: 2),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// شعار SENAM النصي.
class SenamLogo extends StatelessWidget {
  final double fontSize;
  const SenamLogo({super.key, this.fontSize = 22});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        ShaderMask(
          shaderCallback: (r) => AppColors.goldGradient.createShader(r),
          child: Icon(Icons.diamond_outlined,
              size: fontSize + 4, color: Colors.white),
        ),
        const SizedBox(width: 6),
        Text(
          'SENAM',
          style: TextStyle(
            fontSize: fontSize,
            fontWeight: FontWeight.w800,
            letterSpacing: 3,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}

/// شريط فلاتر أفقي قابل لإعادة الاستخدام.
class FilterChips extends StatelessWidget {
  final List<String> labels;
  final int selectedIndex;
  final ValueChanged<int> onSelected;
  final bool rounded;

  const FilterChips({
    super.key,
    required this.labels,
    required this.selectedIndex,
    required this.onSelected,
    this.rounded = false,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: rounded ? 40 : 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: labels.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final selected = i == selectedIndex;
          return GestureDetector(
            onTap: () => onSelected(i),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: selected ? AppColors.gold : AppColors.surface,
                borderRadius: BorderRadius.circular(rounded ? 20 : 12),
                border: Border.all(
                    color: selected ? AppColors.gold : AppColors.border),
              ),
              child: Text(
                labels[i],
                style: TextStyle(
                  fontSize: rounded ? 12 : 13,
                  fontWeight: FontWeight.w700,
                  color: selected
                      ? const Color(0xFF1A1500)
                      : AppColors.textSecondary,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// حالة تحميل (مؤشر دائري ذهبي).
class LoadingView extends StatelessWidget {
  const LoadingView({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: CircularProgressIndicator(color: AppColors.gold),
    );
  }
}

/// حالة خطأ مع زر إعادة المحاولة.
class ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const ErrorView({super.key, required this.message, this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline,
                size: 56, color: AppColors.textMuted),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: onRetry,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.gold),
                ),
                child: const Text('إعادة المحاولة',
                    style: TextStyle(color: AppColors.gold)),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// حالة فارغة.
class EmptyView extends StatelessWidget {
  final String message;
  final IconData icon;

  const EmptyView({
    super.key,
    required this.message,
    this.icon = Icons.inbox_outlined,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 60, color: AppColors.textMuted),
          const SizedBox(height: 12),
          Text(message,
              style: const TextStyle(color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}
