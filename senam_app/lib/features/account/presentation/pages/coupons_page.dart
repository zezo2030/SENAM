import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';

class CouponsPage extends StatefulWidget {
  const CouponsPage({super.key});
  @override
  State<CouponsPage> createState() => _CouponsPageState();
}

class _CouponsPageState extends State<CouponsPage> {
  final _ctrl = TextEditingController();
  int _tab = 0;

  static const _active = [
    _Coupon('SENAM20', 'خصم 20% على غسيل السيارات', '15 يونيو 2026', 20),
    _Coupon('VIP50', 'خصم 50 ر.ق - عضو VIP', '01 يوليو 2026', 50),
    _Coupon('FIRST10', 'خصم 10 ر.ق على أول طلب', '20 مايو 2026', 10),
  ];
  static const _used = [
    _Coupon('WELCOME15', 'خصم 15 ر.ق', '20 أبريل 2026', 15, used: true),
  ];

  @override
  Widget build(BuildContext context) {
    final list = _tab == 0 ? _active : _used;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text('كوبوناتي'),
      ),
      body: DarkBackground(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _ctrl,
                      decoration: const InputDecoration(
                        hintText: 'أدخل كود الخصم',
                        prefixIcon: Icon(Icons.local_offer_outlined,
                            color: AppColors.gold),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  ElevatedButton(
                    onPressed: () {
                      if (_ctrl.text.trim().isEmpty) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                            content: Text('تم تطبيق الكوبون')),
                      );
                      _ctrl.clear();
                    },
                    child: const Text('تطبيق'),
                  ),
                ],
              ),
            ),
            FilterChips(
              labels: const ['الفعّالة', 'المستخدمة'],
              selectedIndex: _tab,
              onSelected: (i) => setState(() => _tab = i),
              rounded: true,
            ),
            const SizedBox(height: 8),
            Expanded(
              child: list.isEmpty
                  ? const EmptyView(
                      message: 'لا توجد كوبونات',
                      icon: Icons.local_offer_outlined,
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: list.length,
                      separatorBuilder: (_, _) =>
                          const SizedBox(height: 12),
                      itemBuilder: (_, i) => _CouponCard(list[i]),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Coupon {
  final String code;
  final String title;
  final String expiry;
  final int discount;
  final bool used;
  const _Coupon(this.code, this.title, this.expiry, this.discount,
      {this.used = false});
}

class _CouponCard extends StatelessWidget {
  final _Coupon c;
  const _CouponCard(this.c);

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: c.used ? 0.5 : 1,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: AppColors.surface,
          border: Border.all(color: AppColors.gold.withValues(alpha: .25)),
        ),
        child: Row(
          children: [
            Container(
              width: 90,
              height: 110,
              decoration: const BoxDecoration(
                gradient: AppColors.goldGradient,
                borderRadius: BorderRadius.only(
                  topRight: Radius.circular(16),
                  bottomRight: Radius.circular(16),
                ),
              ),
              alignment: Alignment.center,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('${c.discount}',
                      style: const TextStyle(
                          color: Color(0xFF1A1500),
                          fontSize: 30,
                          fontWeight: FontWeight.w900)),
                  const Text('خصم',
                      style: TextStyle(
                          color: Color(0xFF3D2F00),
                          fontWeight: FontWeight.w800)),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(c.title,
                        style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w800)),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.gold.withValues(alpha: .15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(c.code,
                          style: const TextStyle(
                              color: AppColors.gold,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1.5)),
                    ),
                    const SizedBox(height: 6),
                    Text('ينتهي في ${c.expiry}',
                        style: const TextStyle(
                            color: AppColors.textMuted, fontSize: 11)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
