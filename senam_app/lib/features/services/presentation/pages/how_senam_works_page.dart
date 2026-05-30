import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

/// صفحة "كيف تستفيد من SENAM" — خطوات + مزايا + ضمان.
class HowSenamWorksPage extends StatelessWidget {
  const HowSenamWorksPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('كيف تستفيد من SENAM ؟'),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
        children: const [
          _StepsRow(),
          SizedBox(height: 22),
          _SectionTitle(text: 'مزايا SENAM'),
          SizedBox(height: 10),
          _FeatureCard(
            icon: Icons.verified_user_outlined,
            title: 'شركات موثوقة ومعتمدة',
            subtitle: 'نختار أفضل الشركات بعناية',
          ),
          SizedBox(height: 10),
          _FeatureCard(
            icon: Icons.collections_outlined,
            title: 'تصاميم وأعمال سابقة',
            subtitle: 'شاهد نماذج حقيقية لكل شركة',
          ),
          SizedBox(height: 10),
          _FeatureCard(
            icon: Icons.chat_bubble_outline,
            title: 'تواصل مباشر وسريع',
            subtitle: 'تواصل مع الشركات بسهولة',
          ),
          SizedBox(height: 10),
          _FeatureCard(
            icon: Icons.star_outline,
            title: 'تقييمات حقيقية',
            subtitle: 'تقييمات من عملاء حقيقيين',
          ),
          SizedBox(height: 20),
          _SenamGuarantee(),
        ],
      ),
    );
  }
}

class _StepsRow extends StatelessWidget {
  const _StepsRow();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 18, 8, 18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: const [
          Expanded(
            child: _Step(
              number: 3,
              icon: Icons.chat_bubble_outline,
              title: 'تواصل مباشر',
              subtitle: 'تواصل مع الشركة التي تناسبك',
            ),
          ),
          _StepDivider(),
          Expanded(
            child: _Step(
              number: 2,
              icon: Icons.business_outlined,
              title: 'اختر الشركة',
              subtitle: 'تصفح الشركات وتقييماتها وتصاميمها',
            ),
          ),
          _StepDivider(),
          Expanded(
            child: _Step(
              number: 1,
              icon: Icons.search,
              title: 'اختر الخدمة',
              subtitle: 'اختر نوع الخدمة التي تحتاجها',
            ),
          ),
        ],
      ),
    );
  }
}

class _Step extends StatelessWidget {
  final int number;
  final IconData icon;
  final String title;
  final String subtitle;
  const _Step({
    required this.number,
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Stack(
          alignment: Alignment.bottomLeft,
          clipBehavior: Clip.none,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.gold.withValues(alpha: 0.1),
                border: Border.all(
                    color: AppColors.gold.withValues(alpha: 0.45)),
              ),
              alignment: Alignment.center,
              child: Icon(icon, color: AppColors.gold, size: 26),
            ),
            Positioned(
              right: -2,
              top: -2,
              child: Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AppColors.goldGradient,
                ),
                alignment: Alignment.center,
                child: Text(
                  '$number',
                  style: const TextStyle(
                    color: Color(0xFF1A1500),
                    fontWeight: FontWeight.w900,
                    fontSize: 11,
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          title,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w800,
            fontSize: 12,
          ),
        ),
        const SizedBox(height: 3),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Text(
            subtitle,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 9,
              height: 1.4,
            ),
          ),
        ),
      ],
    );
  }
}

class _StepDivider extends StatelessWidget {
  const _StepDivider();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 28),
      child: Icon(Icons.add,
          color: AppColors.gold.withValues(alpha: 0.5), size: 14),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          const Spacer(),
          Text(
            text,
            style: const TextStyle(
              color: AppColors.gold,
              fontWeight: FontWeight.w800,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  const _FeatureCard({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: AppColors.gold.withValues(alpha: 0.12),
              border: Border.all(
                  color: AppColors.gold.withValues(alpha: 0.35)),
            ),
            alignment: Alignment.center,
            child: Icon(icon, color: AppColors.gold, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  textAlign: TextAlign.right,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SenamGuarantee extends StatelessWidget {
  const _SenamGuarantee();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: const LinearGradient(
          colors: [Color(0xFF2A2418), Color(0xFF161410)],
          begin: Alignment.centerRight,
          end: Alignment.centerLeft,
        ),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.45)),
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              gradient: AppColors.goldGradient,
              borderRadius: BorderRadius.circular(14),
            ),
            alignment: Alignment.center,
            child: const Icon(Icons.shield,
                color: Color(0xFF1A1500), size: 28),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: const [
                Text(
                  'ضمان SENAM',
                  style: TextStyle(
                    color: AppColors.gold,
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'نضمن لك جودة الخدمة أو استرجاع المبلغ',
                  textAlign: TextAlign.right,
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
