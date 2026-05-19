import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../domain/entities/company.dart';
import '../pages/company_details_page.dart';

/// بطاقة شركة في القائمة.
class CompanyListCard extends StatelessWidget {
  final Company company;
  const CompanyListCard({super.key, required this.company});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
            builder: (_) => CompanyDetailsPage(company: company)),
      ),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            CompanyLogo(
                label: company.logoLabel,
                color: company.logoColor,
                size: 64),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(company.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 15,
                                color: AppColors.textPrimary)),
                      ),
                      RatingBadge(
                          rating: company.rating,
                          count: company.reviewsCount),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined,
                          size: 13, color: AppColors.textMuted),
                      const SizedBox(width: 2),
                      Text('${company.distanceKm} كم',
                          style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textMuted)),
                      const SizedBox(width: 12),
                      const Icon(Icons.access_time,
                          size: 13, color: AppColors.textMuted),
                      const SizedBox(width: 2),
                      Text(company.durationRange,
                          style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textMuted)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Text('تبدأ من ${company.startPrice} ر.ق',
                          style: const TextStyle(
                              color: AppColors.gold,
                              fontWeight: FontWeight.w800,
                              fontSize: 13)),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          border: Border.all(color: AppColors.gold),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text('عرض الخدمات',
                            style: TextStyle(
                                color: AppColors.gold,
                                fontSize: 12,
                                fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
