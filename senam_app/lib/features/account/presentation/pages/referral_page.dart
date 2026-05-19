import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';

class ReferralPage extends StatelessWidget {
  const ReferralPage({super.key});

  static const _code = 'SENAM-AHMD24';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text('ادعُ صديقاً'),
      ),
      body: DarkBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                height: 160,
                decoration: BoxDecoration(
                  gradient: AppColors.goldGradient,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Stack(
                  children: [
                    Positioned(
                      right: -10,
                      bottom: -10,
                      child: Icon(Icons.card_giftcard,
                          size: 160,
                          color: Colors.white.withValues(alpha: .15)),
                    ),
                    const Padding(
                      padding: EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('اكسب 20 ر.ق',
                              style: TextStyle(
                                  color: Color(0xFF1A1500),
                                  fontSize: 28,
                                  fontWeight: FontWeight.w900)),
                          Text(
                              'لكل صديق يستخدم الكود ويحجز أول طلب،\nستحصل أنت وهو على رصيد 20 ر.ق.',
                              style: TextStyle(
                                  color: Color(0xFF3D2F00),
                                  fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const Text('كود الدعوة',
                  style: TextStyle(
                      color: AppColors.textSecondary, fontSize: 13)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                      color: AppColors.gold.withValues(alpha: .35)),
                ),
                child: Row(
                  children: [
                    const Expanded(
                      child: Text(_code,
                          style: TextStyle(
                              color: AppColors.gold,
                              fontSize: 22,
                              letterSpacing: 2,
                              fontWeight: FontWeight.w800)),
                    ),
                    GestureDetector(
                      onTap: () {
                        Clipboard.setData(
                            const ClipboardData(text: _code));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                              content: Text('تم نسخ الكود')),
                        );
                      },
                      child: const Icon(Icons.copy, color: AppColors.gold),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.share),
                label: const Text('مشاركة الكود'),
              ),
              const SizedBox(height: 24),
              const Text('كيف يعمل',
                  style: TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 16)),
              const SizedBox(height: 12),
              _step(1, 'شارك الكود مع صديقك',
                  'أرسل الكود عبر واتساب، أو وسائل التواصل.'),
              _step(2, 'صديقك يستخدم الكود',
                  'يدخل الكود عند أول طلب فيحصل على 20 ر.ق خصم.'),
              _step(3, 'تحصل أنت على رصيدك',
                  'فور إتمام طلبه يضاف 20 ر.ق إلى محفظتك.'),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: const [
                    Text('إجمالي ما كسبت',
                        style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 13)),
                    SizedBox(height: 8),
                    Text('80 ر.ق',
                        style: TextStyle(
                            color: AppColors.gold,
                            fontSize: 28,
                            fontWeight: FontWeight.w900)),
                    SizedBox(height: 4),
                    Text('من 4 دعوات ناجحة',
                        style: TextStyle(
                            color: AppColors.textMuted, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _step(int n, String title, String desc) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GradientCard(
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.goldGradient,
              ),
              child: Text('$n',
                  style: const TextStyle(
                      color: Color(0xFF1A1500),
                      fontWeight: FontWeight.w900)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w800)),
                  const SizedBox(height: 2),
                  Text(desc,
                      style: const TextStyle(
                          color: AppColors.textSecondary, fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
