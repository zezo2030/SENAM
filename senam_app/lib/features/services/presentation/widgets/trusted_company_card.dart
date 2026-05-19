import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../domain/entities/company.dart';
import '../pages/company_details_page.dart';

/// بطاقة شركة موثوقة (عرض 160).
class TrustedCompanyCard extends StatelessWidget {
  final Company company;
  const TrustedCompanyCard({super.key, required this.company});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
            builder: (_) => CompanyDetailsPage(company: company)),
      ),
      child: Container(
        width: 160,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CompanyLogo(
                    label: company.logoLabel,
                    color: company.logoColor,
                    size: 44),
                const Spacer(),
                const TagPill(
                    text: 'موثوق',
                    icon: Icons.verified,
                    color: AppColors.success),
              ],
            ),
            const SizedBox(height: 12),
            Text(company.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                    color: AppColors.textPrimary)),
            const SizedBox(height: 6),
            RatingBadge(
                rating: company.rating, count: company.reviewsCount),
            const SizedBox(height: 12),
            Text('تبدأ من ${company.startPrice} ر.ق',
                style: const TextStyle(
                    color: AppColors.gold,
                    fontWeight: FontWeight.w700,
                    fontSize: 13)),
          ],
        ),
      ),
    );
  }
}
