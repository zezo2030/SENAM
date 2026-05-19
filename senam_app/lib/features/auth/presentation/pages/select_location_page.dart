import 'package:flutter/material.dart';
import '../../../../app/main_nav.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';

/// اختيار الموقع (المدينة والمنطقة) قبل دخول التطبيق.
class SelectLocationPage extends StatefulWidget {
  const SelectLocationPage({super.key});

  @override
  State<SelectLocationPage> createState() => _SelectLocationPageState();
}

class _SelectLocationPageState extends State<SelectLocationPage> {
  String _city = 'الدوحة';
  String? _area;

  static const _areas = [
    'الوكرة',
    'الريان',
    'الخليج الغربي',
    'لوسيل',
    'الدفنة',
    'الوعب',
    'معيذر',
    'الغرافة',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DarkBackground(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_forward_rounded,
                      color: AppColors.textPrimary),
                  onPressed: () => Navigator.pop(context),
                ),
                const SizedBox(height: 16),
                const Text('حدد موقعك',
                    style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary)),
                const SizedBox(height: 8),
                const Text(
                    'سنعرض لك الشركات والخدمات الأقرب إلى منطقتك.',
                    style: TextStyle(
                        color: AppColors.textSecondary, fontSize: 14)),
                const SizedBox(height: 24),
                GradientCard(
                  onTap: () {},
                  child: Row(
                    children: const [
                      Icon(Icons.my_location, color: AppColors.gold),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text('استخدام الموقع الحالي',
                            style: TextStyle(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w700)),
                      ),
                      Icon(Icons.chevron_left, color: AppColors.textMuted),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                const Text('المدينة',
                    style: TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: _city,
                  dropdownColor: AppColors.surface,
                  decoration: const InputDecoration(
                    prefixIcon:
                        Icon(Icons.location_city, color: AppColors.textMuted),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'الدوحة', child: Text('الدوحة')),
                    DropdownMenuItem(value: 'الريان', child: Text('الريان')),
                    DropdownMenuItem(value: 'الوكرة', child: Text('الوكرة')),
                  ],
                  onChanged: (v) => setState(() => _city = v ?? _city),
                ),
                const SizedBox(height: 20),
                const Text('المنطقة',
                    style: TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w700)),
                const SizedBox(height: 10),
                Expanded(
                  child: ListView.separated(
                    itemCount: _areas.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final selected = _area == _areas[i];
                      return GestureDetector(
                        onTap: () => setState(() => _area = _areas[i]),
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: selected
                                ? AppColors.gold.withValues(alpha: 0.12)
                                : AppColors.surface,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                                color: selected
                                    ? AppColors.gold
                                    : AppColors.border),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.location_on_outlined,
                                  color: selected
                                      ? AppColors.gold
                                      : AppColors.textMuted),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(_areas[i],
                                    style: TextStyle(
                                        color: AppColors.textPrimary,
                                        fontWeight: selected
                                            ? FontWeight.w800
                                            : FontWeight.w500)),
                              ),
                              if (selected)
                                const Icon(Icons.check_circle,
                                    color: AppColors.gold),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 10),
                ElevatedButton(
                  onPressed: _area == null
                      ? null
                      : () => Navigator.pushAndRemoveUntil(
                            context,
                            MaterialPageRoute(builder: (_) => const MainNav()),
                            (_) => false,
                          ),
                  child: const Text('متابعة إلى التطبيق'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
