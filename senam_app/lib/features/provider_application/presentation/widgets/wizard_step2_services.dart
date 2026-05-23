import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../cubit/provider_application_cubit.dart';
import '../cubit/provider_application_state.dart';
import '../pages/provider_application_page.dart';

/// Map between service slug (or category slug) and a Material icon.
/// Falls back to a default if unknown — keeps the UI working without bespoke assets.
const _slugIcons = <String, IconData>{
  'painting': Icons.format_paint_outlined,
  'paint': Icons.format_paint_outlined,
  'cleaning': Icons.cleaning_services_outlined,
  'carwash': Icons.local_car_wash_outlined,
  'car_wash': Icons.local_car_wash_outlined,
  'maintenance': Icons.build_outlined,
  'general_maintenance': Icons.build_outlined,
  'electric': Icons.bolt_outlined,
  'electrical': Icons.bolt_outlined,
  'plumbing': Icons.plumbing_outlined,
  'plumber': Icons.plumbing_outlined,
  'wood': Icons.carpenter_outlined,
  'carpentry': Icons.carpenter_outlined,
  'furniture': Icons.chair_outlined,
  'kitchens': Icons.kitchen_outlined,
  'car_rental': Icons.directions_car_outlined,
  'rental': Icons.directions_car_outlined,
};

IconData _iconForService(String slug) {
  return _slugIcons[slug.toLowerCase()] ?? Icons.miscellaneous_services_outlined;
}

class WizardStep2Services extends StatelessWidget {
  const WizardStep2Services({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ProviderApplicationCubit, ProviderApplicationState>(
      buildWhen: (a, b) =>
          a.services != b.services ||
          a.selectedServiceIds != b.selectedServiceIds ||
          a.catalogLoading != b.catalogLoading ||
          a.customServiceText != b.customServiceText,
      builder: (context, state) {
        final cubit = context.read<ProviderApplicationCubit>();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const WizardSectionTitle(
              'الخدمات التي تقدمها',
              subtitle: 'اختر جميع الخدمات التي تقدمها شركتك',
            ),
            if (state.catalogLoading && state.services.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.gold),
                ),
              )
            else if (state.services.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: Center(
                  child: Text(
                    'لا توجد خدمات متاحة حالياً',
                    style: TextStyle(color: AppColors.textMuted),
                  ),
                ),
              )
            else
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate:
                    const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  childAspectRatio: 0.95,
                ),
                itemCount: state.services.length,
                itemBuilder: (context, index) {
                  final svc = state.services[index];
                  final selected =
                      state.selectedServiceIds.contains(svc.id);
                  return _ServiceTile(
                    label: svc.nameAr,
                    icon: _iconForService(svc.slug),
                    selected: selected,
                    onTap: () => cubit.toggleService(svc.id),
                  );
                },
              ),

            const SizedBox(height: 20),
            const WizardLabel('خدمة أخرى (اكتبها)'),
            TextField(
              decoration: InputDecoration(
                hintText: 'اكتب الخدمة',
                suffixIcon: Container(
                  margin: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: AppColors.gold,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.add_rounded,
                      color: Color(0xFF1A1500)),
                ),
              ),
              onChanged: cubit.setCustomServiceText,
            ),
          ],
        );
      },
    );
  }
}

class _ServiceTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _ServiceTile({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        decoration: BoxDecoration(
          color: selected
              ? AppColors.gold.withValues(alpha: 0.1)
              : AppColors.surfaceLight.withValues(alpha: 0.4),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected
                ? AppColors.gold
                : AppColors.textMuted.withValues(alpha: 0.25),
            width: selected ? 1.6 : 1,
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
        child: Stack(
          children: [
            if (selected)
              const Positioned(
                top: 0,
                left: 0,
                child: Icon(Icons.check_circle,
                    color: AppColors.gold, size: 20),
              ),
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    icon,
                    size: 32,
                    color: selected
                        ? AppColors.gold
                        : AppColors.textSecondary,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    label,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
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
