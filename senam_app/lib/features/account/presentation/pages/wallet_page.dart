import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';

class WalletPage extends StatelessWidget {
  const WalletPage({super.key});

  @override
  Widget build(BuildContext context) {
    final tx = const [
      _Tx('استرجاع طلب #1024', 35.0, true, 'الأمس'),
      _Tx('شحن من Visa **42', 100.0, true, '14 مايو'),
      _Tx('دفع طلب #1018', 65.0, false, '10 مايو'),
      _Tx('بونص دعوة صديق', 20.0, true, '8 مايو'),
      _Tx('دفع طلب #1011', 90.0, false, '5 مايو'),
    ];
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text('محفظتي'),
      ),
      body: DarkBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                height: 170,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  gradient: AppColors.goldGradient,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Text('الرصيد الحالي',
                        style: TextStyle(
                            color: Color(0xFF1A1500),
                            fontWeight: FontWeight.w700)),
                    Text('250.00 ر.ق',
                        style: TextStyle(
                            color: Color(0xFF1A1500),
                            fontSize: 32,
                            fontWeight: FontWeight.w900)),
                    Text('محفظة سنام الرقمية',
                        style: TextStyle(color: Color(0xFF3D2F00))),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.add_circle_outline),
                      label: const Text('شحن'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.send_outlined,
                          color: AppColors.gold),
                      label: const Text('تحويل',
                          style: TextStyle(color: AppColors.gold)),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppColors.gold),
                        padding:
                            const EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              const Text('سجل المعاملات',
                  style: TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 16)),
              const SizedBox(height: 10),
              ...tx.map((t) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: GradientCard(
                      child: Row(
                        children: [
                          Container(
                            width: 42,
                            height: 42,
                            decoration: BoxDecoration(
                              color: (t.incoming
                                      ? AppColors.success
                                      : AppColors.error)
                                  .withValues(alpha: .12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                              t.incoming
                                  ? Icons.arrow_downward_rounded
                                  : Icons.arrow_upward_rounded,
                              color: t.incoming
                                  ? AppColors.success
                                  : AppColors.error,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment:
                                  CrossAxisAlignment.start,
                              children: [
                                Text(t.title,
                                    style: const TextStyle(
                                        color: AppColors.textPrimary,
                                        fontWeight: FontWeight.w700)),
                                const SizedBox(height: 2),
                                Text(t.date,
                                    style: const TextStyle(
                                        color: AppColors.textMuted,
                                        fontSize: 12)),
                              ],
                            ),
                          ),
                          Text(
                            '${t.incoming ? '+' : '-'}${t.amount.toStringAsFixed(0)} ر.ق',
                            style: TextStyle(
                              color: t.incoming
                                  ? AppColors.success
                                  : AppColors.error,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )),
            ],
          ),
        ),
      ),
    );
  }
}

class _Tx {
  final String title;
  final double amount;
  final bool incoming;
  final String date;
  const _Tx(this.title, this.amount, this.incoming, this.date);
}
