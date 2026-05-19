import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';

/// شاشة البحث العامة (شركات وخدمات).
class SearchPage extends StatefulWidget {
  const SearchPage({super.key});
  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final _ctrl = TextEditingController();
  String _q = '';

  static const _recent = [
    'غسيل سيارات',
    'تنظيف منزل',
    'حلاقة رجالي',
    'صيانة مكيفات',
  ];

  static const _popular = [
    ('سيارات', Icons.directions_car_filled, Color(0xFFC9A24B)),
    ('تنظيف', Icons.cleaning_services, Color(0xFF7E8FE0)),
    ('حلاقة', Icons.content_cut, Color(0xFFE0A93C)),
    ('سباكة', Icons.plumbing, Color(0xFF4CAF7D)),
    ('كهرباء', Icons.electric_bolt, Color(0xFFE05B5B)),
    ('تأجير سيارات', Icons.car_rental, Color(0xFF9B7AE0)),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        titleSpacing: 0,
        title: Container(
          height: 44,
          margin: const EdgeInsets.only(left: 12),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              const Icon(Icons.search, color: AppColors.gold),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _ctrl,
                  autofocus: true,
                  onChanged: (v) => setState(() => _q = v),
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                    hintText: 'ابحث عن خدمة أو شركة...',
                  ),
                ),
              ),
              if (_q.isNotEmpty)
                GestureDetector(
                  onTap: () {
                    _ctrl.clear();
                    setState(() => _q = '');
                  },
                  child:
                      const Icon(Icons.close, color: AppColors.textMuted),
                ),
            ],
          ),
        ),
      ),
      body: DarkBackground(
        child: _q.isEmpty ? _suggestions() : _results(),
      ),
    );
  }

  Widget _suggestions() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('عمليات بحث سابقة',
            style: TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w800,
                fontSize: 15)),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _recent
              .map((s) => GestureDetector(
                    onTap: () {
                      _ctrl.text = s;
                      setState(() => _q = s);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.history,
                              size: 14, color: AppColors.textMuted),
                          const SizedBox(width: 6),
                          Text(s,
                              style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 12)),
                        ],
                      ),
                    ),
                  ))
              .toList(),
        ),
        const SizedBox(height: 24),
        const Text('الأقسام الشائعة',
            style: TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w800,
                fontSize: 15)),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate:
              const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1,
          ),
          itemCount: _popular.length,
          itemBuilder: (_, i) {
            final p = _popular[i];
            return Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                    color: p.$3.withValues(alpha: .25)),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(p.$2, color: p.$3, size: 30),
                  const SizedBox(height: 8),
                  Text(p.$1,
                      style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w700,
                          fontSize: 12)),
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _results() {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      separatorBuilder: (_, _) => const SizedBox(height: 10),
      itemBuilder: (_, i) => GradientCard(
        onTap: () {},
        child: Row(
          children: [
            CompanyLogo(
              label: 'S$i',
              color: i.isEven ? AppColors.gold : AppColors.info,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('$_q - نتيجة ${i + 1}',
                      style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w800)),
                  const SizedBox(height: 4),
                  const Text('الدوحة - الوعب',
                      style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12)),
                  const SizedBox(height: 6),
                  Row(
                    children: const [
                      RatingBadge(rating: 4.7, count: 120),
                      SizedBox(width: 10),
                      Icon(Icons.local_offer,
                          size: 12, color: AppColors.gold),
                      SizedBox(width: 4),
                      Text('من 35 ر.ق',
                          style: TextStyle(
                              color: AppColors.gold,
                              fontWeight: FontWeight.w700,
                              fontSize: 12)),
                    ],
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_left, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}
