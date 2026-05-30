import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/whatsapp_launcher.dart';
import '../../domain/entities/company.dart';
import '../widgets/feature_icons.dart';
import 'company_reviews_page.dart';
import 'company_works_page.dart';

/// صفحة تفاصيل الشركة — صورة هيرو + كارت اللوجو + أزرار التواصل +
/// كارت موحَّد لـ"نبذة عن الشركة" و"مميزات الشركة".
class CompanyDetailsPage extends StatefulWidget {
  final Company company;
  const CompanyDetailsPage({super.key, required this.company});

  @override
  State<CompanyDetailsPage> createState() => _CompanyDetailsPageState();
}

class _CompanyDetailsPageState extends State<CompanyDetailsPage> {
  bool _fav = false;

  Company get c => widget.company;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _Hero(
                company: c,
                fav: _fav,
                onFav: () => setState(() => _fav = !_fav),
                onBack: () => Navigator.pop(context),
              ),
              const SizedBox(height: 16),
              _HeaderRow(company: c),
              const SizedBox(height: 14),
              _InfoChipsRow(company: c),
              const SizedBox(height: 16),
              _ActionPillsRow(company: c),
              const SizedBox(height: 16),
              _AboutAndFeaturesCard(company: c),
              const SizedBox(height: 16),
              _RateCompanyButton(company: c),
              const SizedBox(height: 12),
              _BottomCtaRow(company: c),
            ],
          ),
        ),
      ),
    );
  }
}

class _RateCompanyButton extends StatelessWidget {
  final Company company;
  const _RateCompanyButton({required this.company});

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: () => openCompanyReviewFlow(context, company),
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.gold,
        backgroundColor: AppColors.gold.withValues(alpha: 0.08),
        padding: const EdgeInsets.symmetric(vertical: 14),
        side: BorderSide(
          color: AppColors.gold.withValues(alpha: 0.82),
          width: 1.1,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
        ),
        textStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w900,
        ),
      ),
      icon: const Icon(Icons.star_rounded, size: 18),
      label: const Text('قيّم الشركة'),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM CTAs: «عرض التصاميم» (gold) + «تواصل واتساب» (outlined)
// ─────────────────────────────────────────────────────────────────────────────
class _BottomCtaRow extends StatelessWidget {
  final Company company;
  const _BottomCtaRow({required this.company});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => CompanyWorksPage(company: company),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.gold,
              foregroundColor: const Color(0xFF1A1500),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              textStyle: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
              ),
            ),
            icon: const Icon(Icons.collections_outlined, size: 18),
            label: const Text('عرض التصاميم'),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () => openWhatsApp(
              context,
              company.whatsappLink.isNotEmpty
                  ? company.whatsappLink
                  : company.whatsapp,
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.gold,
              foregroundColor: const Color(0xFF1A1500),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              textStyle: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
              ),
            ),
            icon: const Icon(Icons.chat, size: 18),
            label: const Text('تواصل واتساب'),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────
class _Hero extends StatelessWidget {
  final Company company;
  final bool fav;
  final VoidCallback onFav;
  final VoidCallback onBack;
  const _Hero({
    required this.company,
    required this.fav,
    required this.onFav,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    final photo = company.coverPhoto.isNotEmpty
        ? company.coverPhoto
        : (company.workPhotos.isNotEmpty ? company.workPhotos.first : null);
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: AspectRatio(
        aspectRatio: 16 / 11,
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (photo != null)
              CachedNetworkImage(
                imageUrl: photo,
                fit: BoxFit.cover,
                errorWidget: (_, _, _) => _fallbackBg(),
                placeholder: (_, __) => _fallbackBg(),
              )
            else
              _fallbackBg(),
            // طبقة تعتيم خفيفة لإبراز الأيقونات
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0x55000000), Color(0x00000000)],
                ),
              ),
            ),
            Positioned(
              top: 10,
              left: 10,
              right: 10,
              child: Row(
                children: [
                  // RTL: أول children = يمين → bookmark + share
                  _HeroIconButton(
                    icon: fav ? Icons.bookmark : Icons.bookmark_border,
                    iconColor: AppColors.gold,
                    onTap: onFav,
                  ),
                  const SizedBox(width: 8),
                  _HeroIconButton(
                    icon: Icons.ios_share,
                    onTap: () {},
                  ),
                  const Spacer(),
                  // آخر child = يسار → زر الرجوع
                  _HeroIconButton(icon: Icons.arrow_back, onTap: onBack),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _fallbackBg() => DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              company.logoColor.withValues(alpha: 0.55),
              AppColors.background,
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
      );
}

class _HeroIconButton extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final VoidCallback onTap;
  const _HeroIconButton({
    required this.icon,
    required this.onTap,
    this.iconColor = AppColors.textPrimary,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(10),
        ),
        alignment: Alignment.center,
        child: Icon(icon, color: iconColor, size: 18),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADER (logo + name/rating/description)
// ─────────────────────────────────────────────────────────────────────────────
class _HeaderRow extends StatelessWidget {
  final Company company;
  const _HeaderRow({required this.company});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // RTL: أول child = يمين → معلومات الشركة
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    company.name,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  if (company.isTrusted) ...[
                    const SizedBox(width: 5),
                    Container(
                      width: 18,
                      height: 18,
                      decoration: const BoxDecoration(
                        color: AppColors.success,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: const Icon(Icons.check,
                          color: Colors.white, size: 12),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 6),
              GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => CompanyReviewsPage(company: company),
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '(${company.reviewsCount}) تقييم',
                    style: const TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 11,
                    ),
                  ),
                  const SizedBox(width: 6),
                  ...List.generate(5, (i) {
                    final filled = i < company.rating.round();
                    return Icon(
                      Icons.star_rounded,
                      color: filled
                          ? AppColors.gold
                          : AppColors.gold.withValues(alpha: 0.22),
                      size: 14,
                    );
                  }),
                ],
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                company.description.isNotEmpty
                    ? company.description
                    : 'مطابخ عصرية بتصاميم فاخرة وجودة عالية',
                textAlign: TextAlign.right,
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        // RTL: آخر child = يسار → كارت اللوجو
        _BrandLogoBox(company: company),
      ],
    );
  }
}

class _BrandLogoBox extends StatelessWidget {
  final Company company;
  const _BrandLogoBox({required this.company});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 104,
      height: 104,
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.gold, width: 2),
      ),
      alignment: Alignment.center,
      clipBehavior: Clip.antiAlias,
      child: company.logoUrl.isNotEmpty
          ? CachedNetworkImage(
              imageUrl: company.logoUrl,
              width: 104,
              height: 104,
              fit: BoxFit.cover,
              errorWidget: (_, _, _) => _fallbackLabel(),
              placeholder: (_, __) => _fallbackLabel(),
            )
          : _fallbackLabel(),
    );
  }

  Widget _fallbackLabel() {
    final label = company.name.trim();
    final parts = label.split(RegExp(r'\s+'));
    final line1 = parts.isNotEmpty ? parts.first : label;
    final line2 = parts.length > 1 ? parts.sublist(1).join(' ') : '';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            line1,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.gold,
              fontWeight: FontWeight.w900,
              fontSize: line2.isEmpty ? 22 : 18,
              letterSpacing: 1.4,
              height: 1,
            ),
          ),
          if (line2.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              line2,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.gold,
                fontWeight: FontWeight.w700,
                fontSize: 11,
                letterSpacing: 1.2,
                height: 1,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INFO CHIPS (city + experience)
// ─────────────────────────────────────────────────────────────────────────────
class _InfoChipsRow extends StatelessWidget {
  final Company company;
  const _InfoChipsRow({required this.company});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // RTL: أول child = يمين → المدينة
        _IconLabel(
          icon: Icons.location_on_outlined,
          text: company.city,
        ),
        const SizedBox(width: 18),
        // آخر child = يسار → سنوات الخبرة
        if (company.experienceYears.isNotEmpty)
          _IconLabel(
            icon: Icons.workspace_premium_outlined,
            text: '${company.experienceYears} سنوات خبرة',
          ),
      ],
    );
  }
}

class _IconLabel extends StatelessWidget {
  final IconData icon;
  final String text;
  const _IconLabel({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          text,
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 12,
          ),
        ),
        const SizedBox(width: 4),
        Icon(icon, color: AppColors.gold, size: 14),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION PILLS (4 horizontal contact buttons)
// ─────────────────────────────────────────────────────────────────────────────
class _ActionPillsRow extends StatelessWidget {
  final Company company;
  const _ActionPillsRow({required this.company});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // RTL: أول child = يمين الشاشة → واتساب
        Expanded(
          child: _ActionPill(
            label: 'تواصل واتساب',
            icon: Icons.chat,
            onTap: () => _toast(context, 'سيتم فتح واتساب'),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _ActionPill(
            label: 'اتصال',
            icon: Icons.call,
            onTap: () => _toast(
              context,
              company.phone.isEmpty
                  ? 'سيتم فتح الاتصال'
                  : 'اتصال: ${company.phone}',
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _ActionPill(
            label: 'موقع الشركة',
            icon: Icons.location_on_outlined,
            onTap: () {
              final target = company.mapUrl.isNotEmpty
                  ? company.mapUrl
                  : (company.latitude != null && company.longitude != null
                      ? 'geo:${company.latitude},${company.longitude}'
                      : 'سيتم فتح الموقع');
              _toast(context, target);
            },
          ),
        ),
        const SizedBox(width: 8),
        // RTL: آخر child = يسار → إنستقرام
        Expanded(
          child: _ActionPill(
            label: 'إنستقرام',
            icon: Icons.camera_alt_outlined,
            onTap: () => _toast(
              context,
              company.instagram.isEmpty
                  ? 'سيتم فتح إنستقرام'
                  : 'إنستقرام: ${company.instagram}',
            ),
          ),
        ),
      ],
    );
  }

  void _toast(BuildContext context, String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }
}

class _ActionPill extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  const _ActionPill({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: AppColors.gold.withValues(alpha: 0.15),
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppColors.gold.withValues(alpha: 0.45),
                  width: 1,
                ),
              ),
              alignment: Alignment.center,
              child: Icon(icon, color: AppColors.gold, size: 16),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 10,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ABOUT + FEATURES CARD
// ─────────────────────────────────────────────────────────────────────────────
class _AboutAndFeaturesCard extends StatelessWidget {
  final Company company;
  const _AboutAndFeaturesCard({required this.company});

  @override
  Widget build(BuildContext context) {
    final aboutText = company.description.trim().isNotEmpty
        ? company.description.trim()
        : 'تقدّم خدمات احترافية بأعلى معايير الجودة وتنفيذ متقن.';

    final features = company.features
        .where((f) => f.label.trim().isNotEmpty)
        .toList();

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // نبذة عن الشركة
          GestureDetector(
            onTap: null,
            behavior: HitTestBehavior.opaque,
            child: const Align(
              alignment: Alignment.centerRight,
              child: Text(
                'نبذة عن الشركة',
                style: TextStyle(
                  color: AppColors.gold,
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            aboutText,
            textAlign: TextAlign.right,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 12,
              height: 1.75,
            ),
          ),
          if (features.isNotEmpty) ...[
            const SizedBox(height: 18),
            const Align(
              alignment: Alignment.centerRight,
              child: Text(
                'مميزات الشركة',
                style: TextStyle(
                  color: AppColors.gold,
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            const SizedBox(height: 12),
            _FeaturesGrid(features: features),
          ],
        ],
      ),
    );
  }
}

/// شبكة عمودين × عدد صفوف ديناميكي للمميزات. النص يلف على سطرين بدل
/// ما يتقطّع، عشان كل اللي بيختاره صاحب الشركة من الداشبورد يبان كامل.
class _FeaturesGrid extends StatelessWidget {
  final List<CompanyFeature> features;
  const _FeaturesGrid({required this.features});

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    for (var i = 0; i < features.length; i += 2) {
      final left = features[i];
      final right = i + 1 < features.length ? features[i + 1] : null;
      if (i > 0) rows.add(const SizedBox(height: 12));
      rows.add(Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: _FeatureRowCell(feature: left)),
          const SizedBox(width: 12),
          Expanded(
            child: right == null
                ? const SizedBox.shrink()
                : _FeatureRowCell(feature: right),
          ),
        ],
      ));
    }
    return Column(children: rows);
  }
}

class _FeatureRowCell extends StatelessWidget {
  final CompanyFeature feature;
  const _FeatureRowCell({required this.feature});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // الأيقونة أولاً (يمين في RTL) ملاصقة للنص بدون مسافة
        Padding(
          padding: const EdgeInsets.only(top: 1),
          child: Icon(featureIconFor(feature.icon),
              color: AppColors.gold, size: 14),
        ),
        // النص ملاصق للأيقونة
        Expanded(
          child: Text(
            feature.label,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.right,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              height: 1.45,
            ),
          ),
        ),
      ],
    );
  }
}
