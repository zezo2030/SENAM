import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';

class AboutPage extends StatelessWidget {
  const AboutPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text('عن سنام'),
      ),
      body: DarkBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Center(child: SenamLogo(fontSize: 30)),
              const SizedBox(height: 8),
              const Center(
                child: Text('الإصدار 1.0.0',
                    style: TextStyle(
                        color: AppColors.textMuted, fontSize: 12)),
              ),
              const SizedBox(height: 24),
              GradientCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text('رؤيتنا',
                        style: TextStyle(
                            color: AppColors.gold,
                            fontWeight: FontWeight.w800)),
                    SizedBox(height: 8),
                    Text(
                      'أن تكون سنام المنصة الأولى الموثوقة لحجز الخدمات في قطر والخليج، بمعايير جودة وفخامة لا مثيل لها.',
                      style: TextStyle(
                          color: AppColors.textPrimary, height: 1.7),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              GradientCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text('رسالتنا',
                        style: TextStyle(
                            color: AppColors.gold,
                            fontWeight: FontWeight.w800)),
                    SizedBox(height: 8),
                    Text(
                      'تمكين العملاء من الوصول لأفضل الخدمات وأسعارها العادلة، وتمكين الشركات من الوصول لقاعدة عملاء أوسع عبر تجربة رقمية متكاملة.',
                      style: TextStyle(
                          color: AppColors.textPrimary, height: 1.7),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const Text('قيمنا',
                  style: TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 16)),
              const SizedBox(height: 10),
              _value(Icons.verified_user, 'الثقة والشفافية',
                  'كل خدمة عبر سنام تأتي مع ضمان وثقة كاملة.'),
              _value(Icons.workspace_premium, 'جودة معتمدة',
                  'اختيار الشركات بعناية وتقييمات مستمرة.'),
              _value(Icons.bolt, 'سرعة الإنجاز',
                  'حجز وإنجاز الخدمة بأقصر وقت ممكن.'),
              _value(Icons.diamond_outlined, 'تجربة فخمة',
                  'تصميم وتجربة استخدام بمعايير عالمية.'),
              const SizedBox(height: 24),
              const Text('تواصل معنا',
                  style: TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 16)),
              const SizedBox(height: 10),
              _contact(Icons.public, 'www.senam.qa'),
              _contact(Icons.mail_outline, 'hello@senam.qa'),
              _contact(Icons.phone, '+974 4444 5555'),
              _contact(Icons.location_on_outlined,
                  'الدوحة، قطر - برج المرقاب'),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _social(Icons.camera_alt_outlined),
                  _social(Icons.alternate_email),
                  _social(Icons.facebook),
                  _social(Icons.play_arrow_rounded),
                ],
              ),
              const SizedBox(height: 24),
              const Center(
                child: Text('© 2026 SENAM Qatar. جميع الحقوق محفوظة.',
                    style: TextStyle(
                        color: AppColors.textMuted, fontSize: 12)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _value(IconData icon, String title, String desc) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GradientCard(
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: AppColors.gold.withValues(alpha: .12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: AppColors.gold),
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

  Widget _contact(IconData icon, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, color: AppColors.gold, size: 20),
          const SizedBox(width: 10),
          Text(value,
              style: const TextStyle(color: AppColors.textPrimary)),
        ],
      ),
    );
  }

  Widget _social(IconData icon) {
    return Container(
      width: 44,
      height: 44,
      margin: const EdgeInsets.symmetric(horizontal: 6),
      decoration: BoxDecoration(
        color: AppColors.surface,
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.gold.withValues(alpha: .25)),
      ),
      child: Icon(icon, color: AppColors.gold, size: 20),
    );
  }
}
