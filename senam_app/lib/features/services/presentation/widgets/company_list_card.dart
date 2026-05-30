import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../../core/config/media_url.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/whatsapp_launcher.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../domain/entities/company.dart';
import '../pages/company_details_page.dart';

/// زرّ واتساب أخضر يُستخدم في عدّة صفحات.
class WhatsAppButton extends StatelessWidget {
  final String? phone;
  final EdgeInsetsGeometry padding;
  final double fontSize;
  final bool expanded;
  final String label;

  const WhatsAppButton({
    super.key,
    this.phone,
    this.padding = const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    this.fontSize = 13,
    this.expanded = false,
    this.label = 'تواصل واتساب',
  });

  @override
  Widget build(BuildContext context) {
    final child = Row(
      mainAxisSize: expanded ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.chat, color: AppColors.gold, size: 16),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            color: AppColors.gold,
            fontWeight: FontWeight.w800,
            fontSize: fontSize,
          ),
        ),
      ],
    );
    return GestureDetector(
      onTap: () => openWhatsApp(context, phone ?? ''),
      child: Container(
        padding: padding,
        decoration: BoxDecoration(
          color: AppColors.gold.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppColors.gold.withValues(alpha: 0.82),
            width: 1.1,
          ),
        ),
        child: child,
      ),
    );
  }
}

/// بطاقة شركة في القائمة — بدون أسعار، مع صورة على اليمين، بوكمارك،
/// وزرّي "تواصل واتساب" + "عرض التصاميم".
class CompanyListCard extends StatefulWidget {
  final Company company;
  final String detailsLabel;
  const CompanyListCard({
    super.key,
    required this.company,
    this.detailsLabel = 'عرض التصاميم',
  });

  @override
  State<CompanyListCard> createState() => _CompanyListCardState();
}

class _CompanyListCardState extends State<CompanyListCard> {
  bool _saved = false;

  Company get c => widget.company;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
            builder: (_) => CompanyDetailsPage(company: c)),
      ),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            IntrinsicHeight(
              child: Row(
                children: [
                  // الصورة على يسار الكارت (مع البوكمارك أعلاها)
                  Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: _Thumb(company: c),
                      ),
                      Positioned(
                        top: 6,
                        left: 6,
                        child: GestureDetector(
                          onTap: () =>
                              setState(() => _saved = !_saved),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.55),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              _saved
                                  ? Icons.bookmark
                                  : Icons.bookmark_border,
                              color: AppColors.gold,
                              size: 16,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  // النصوص على يمين الكارت
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            RatingBadge(
                                rating: c.rating, count: c.reviewsCount),
                            const SizedBox(width: 6),
                            Flexible(
                              child: Text(
                                c.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.right,
                                style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 15,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            Text(
                              c.city,
                              style: const TextStyle(
                                color: AppColors.textMuted,
                                fontSize: 11,
                              ),
                            ),
                            const SizedBox(width: 3),
                            const Icon(Icons.location_on_outlined,
                                color: AppColors.textMuted, size: 12),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          c.description,
                          textAlign: TextAlign.right,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 11,
                            height: 1.45,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) =>
                            CompanyDetailsPage(company: c),
                      ),
                    ),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 11),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        gradient: AppColors.goldGradient,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        widget.detailsLabel,
                        style: const TextStyle(
                          color: Color(0xFF1A1500),
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: WhatsAppButton(
                    phone: c.whatsapp,
                    expanded: true,
                    padding:
                        const EdgeInsets.symmetric(vertical: 11),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Thumb extends StatelessWidget {
  final Company company;
  const _Thumb({required this.company});

  @override
  Widget build(BuildContext context) {
    const size = 104.0;
    final logoUrl = resolveMediaUrl(company.logoUrl);
    final coverUrl = resolveMediaUrl(company.coverPhoto);

    return Container(
      width: size,
      height: size,
      color: AppColors.surfaceLight,
      child: Stack(
        fit: StackFit.expand,
        children: [
          coverUrl.isNotEmpty
              ? CachedNetworkImage(
                  imageUrl: coverUrl,
                  width: size,
                  height: size,
                  fit: BoxFit.cover,
                  errorWidget: (c, e, s) => _coverFallback(),
                  placeholder: (c, url) => _coverFallback(),
                )
              : _coverFallback(),
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withValues(alpha: 0.08),
                  Colors.black.withValues(alpha: 0.24),
                ],
              ),
            ),
          ),
          Center(child: _companyLogo(logoUrl)),
        ],
      ),
    );
  }

  Widget _companyLogo(String logoUrl) {
    const logoSize = 56.0;
    return Container(
      width: logoSize,
      height: logoSize,
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: AppColors.surface.withValues(alpha: 0.88),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.12),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.22),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(13),
        child: logoUrl.isNotEmpty
            ? CachedNetworkImage(
                imageUrl: logoUrl,
                width: logoSize,
                height: logoSize,
                fit: BoxFit.cover,
                errorWidget: (c, e, s) => _logoFallback(),
                placeholder: (c, url) => _logoFallback(),
              )
            : _logoFallback(),
      ),
    );
  }

  Widget _coverFallback() => Container(
        color: AppColors.surfaceLight,
      );

  Widget _logoFallback() => CompanyLogo(
        label: company.logoLabel,
        color: company.logoColor,
        size: 50,
      );
}
