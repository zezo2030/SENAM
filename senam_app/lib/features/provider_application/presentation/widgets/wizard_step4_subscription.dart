import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/kyc_document.dart';
import '../cubit/provider_application_cubit.dart';
import '../cubit/provider_application_state.dart';
import '../pages/provider_application_page.dart';

/// Monthly prices (QAR). Annual is monthly × 10, promo is monthly × 0.7.
const _monthlyPriceByTier = <SubscriptionPlanTier, int>{
  SubscriptionPlanTier.basic: 299,
  SubscriptionPlanTier.pro: 799,
  SubscriptionPlanTier.vip: 1999,
};

int _priceFor(
  SubscriptionPlanTier tier,
  SubscriptionBillingPeriod period,
) {
  final m = _monthlyPriceByTier[tier]!;
  return switch (period) {
    SubscriptionBillingPeriod.monthly => m,
    SubscriptionBillingPeriod.annual => m * 10,
    SubscriptionBillingPeriod.promo => (m * 0.7).round(),
  };
}

class WizardStep4Subscription extends StatelessWidget {
  const WizardStep4Subscription({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ProviderApplicationCubit, ProviderApplicationState>(
      buildWhen: (a, b) =>
          a.subscriptionPlan != b.subscriptionPlan ||
          a.subscriptionPeriod != b.subscriptionPeriod,
      builder: (context, state) {
        final cubit = context.read<ProviderApplicationCubit>();
        final selectedPlan = state.subscriptionPlan;
        final period = state.subscriptionPeriod;
        final price =
            selectedPlan == null ? 0 : _priceFor(selectedPlan, period);
        final vat = (price * 0.05).round();
        final total = price + vat;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const WizardSectionTitle(
              'اختر الباقة المناسبة لك',
              subtitle:
                  'اختر الباقة التي تناسب حجم أعمالك واحتياجاتك',
            ),

            // ── Period selector ────────────────────────────────────────
            Center(
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AppColors.surfaceLight.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(30),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _PeriodChip(
                      label: SubscriptionBillingPeriod.monthly.labelAr,
                      selected: period == SubscriptionBillingPeriod.monthly,
                      onTap: () => cubit.setSubscriptionPeriod(
                          SubscriptionBillingPeriod.monthly),
                    ),
                    _PeriodChip(
                      label: SubscriptionBillingPeriod.annual.labelAr,
                      selected: period == SubscriptionBillingPeriod.annual,
                      onTap: () => cubit.setSubscriptionPeriod(
                          SubscriptionBillingPeriod.annual),
                    ),
                    _PeriodChip(
                      label: SubscriptionBillingPeriod.promo.labelAr,
                      selected: period == SubscriptionBillingPeriod.promo,
                      onTap: () => cubit.setSubscriptionPeriod(
                          SubscriptionBillingPeriod.promo),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // ── Plan cards ─────────────────────────────────────────────
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _PlanCard(
                    tier: SubscriptionPlanTier.vip,
                    selected: selectedPlan == SubscriptionPlanTier.vip,
                    period: period,
                    onTap: () =>
                        cubit.setSubscriptionPlan(SubscriptionPlanTier.vip),
                    accent: AppColors.gold,
                    label: 'VIP',
                    badgeIcon: Icons.workspace_premium,
                    perks: const [
                      'أولوية في الظهور',
                      'شعار مواقع ذهبي',
                      'عدد طلبات غير محدود',
                      'بثر داخل التطبيق',
                      'دعم مخصص وأولوية',
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _PlanCard(
                    tier: SubscriptionPlanTier.pro,
                    selected: selectedPlan == SubscriptionPlanTier.pro,
                    period: period,
                    onTap: () =>
                        cubit.setSubscriptionPlan(SubscriptionPlanTier.pro),
                    accent: AppColors.gold,
                    label: 'Pro',
                    badgeIcon: null,
                    isMostPopular: true,
                    perks: const [
                      'ظهور أعلى في النتائج',
                      'شعار مواقع',
                      'عدد طلبات أكبر',
                      'دعم عبر الرسائل',
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _PlanCard(
                    tier: SubscriptionPlanTier.basic,
                    selected: selectedPlan == SubscriptionPlanTier.basic,
                    period: period,
                    onTap: () =>
                        cubit.setSubscriptionPlan(SubscriptionPlanTier.basic),
                    accent: AppColors.textSecondary,
                    label: 'Basic',
                    badgeIcon: null,
                    perks: const [
                      'ظهور في النتائج',
                      'شعار مواقع محدود',
                      'عدد طلبات محدود',
                      'دعم عبر الرسائل',
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 18),

            // ── Order summary ──────────────────────────────────────────
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surfaceLight.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.textMuted.withValues(alpha: 0.18),
                ),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'ملخص الطلب',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        selectedPlan?.labelAr ?? '—',
                        style: const TextStyle(
                          color: AppColors.gold,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  _SummaryRow(
                    label: 'السعر الشهري',
                    value: '$price ر.ق',
                  ),
                  _SummaryRow(
                    label: 'ضريبة القيمة المضافة (5%)',
                    value: '$vat ر.ق',
                  ),
                  const Divider(
                      color: AppColors.textMuted, height: 18, thickness: 0.4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'الإجمالي',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        '$total ر.ق',
                        style: const TextStyle(
                          color: AppColors.gold,
                          fontWeight: FontWeight.w900,
                          fontSize: 18,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'سيتم تفعيل حسابكم بعد مراجعة الطلب وتأكيد الدفع.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.textMuted,
                fontSize: 11,
              ),
            ),
          ],
        );
      },
    );
  }
}

class _PeriodChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _PeriodChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(28),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.gold : Colors.transparent,
          borderRadius: BorderRadius.circular(28),
        ),
        child: Text(
          label,
          style: TextStyle(
            color:
                selected ? const Color(0xFF1A1500) : AppColors.textSecondary,
            fontWeight: FontWeight.w700,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  final SubscriptionPlanTier tier;
  final SubscriptionBillingPeriod period;
  final bool selected;
  final VoidCallback onTap;
  final Color accent;
  final String label;
  final IconData? badgeIcon;
  final bool isMostPopular;
  final List<String> perks;

  const _PlanCard({
    required this.tier,
    required this.period,
    required this.selected,
    required this.onTap,
    required this.accent,
    required this.label,
    required this.badgeIcon,
    this.isMostPopular = false,
    required this.perks,
  });

  @override
  Widget build(BuildContext context) {
    final price = _priceFor(tier, period);
    final per = switch (period) {
      SubscriptionBillingPeriod.monthly => 'شهر',
      SubscriptionBillingPeriod.annual => 'سنة',
      SubscriptionBillingPeriod.promo => 'شهر',
    };
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 10),
            padding: const EdgeInsets.fromLTRB(10, 16, 10, 12),
            decoration: BoxDecoration(
              color: selected
                  ? accent.withValues(alpha: 0.12)
                  : AppColors.surfaceLight.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: selected ? accent : AppColors.textMuted.withValues(alpha: 0.25),
                width: selected ? 1.6 : 1,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                if (badgeIcon != null)
                  Icon(badgeIcon, color: AppColors.gold, size: 20),
                Text(
                  label,
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                    height: 1.1,
                    decoration: TextDecoration.none,
                    fontFeatures: const [],
                    backgroundColor: Colors.transparent,
                    shadows: selected
                        ? [Shadow(color: accent.withValues(alpha: 0.4), blurRadius: 6)]
                        : null,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '$price',
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      ' ر.ق/$per',
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ...perks.map((p) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 1.5),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Padding(
                            padding: EdgeInsets.only(top: 2),
                            child: Icon(Icons.check_rounded,
                                color: AppColors.gold, size: 11),
                          ),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              p,
                              style: const TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 9.5,
                                height: 1.25,
                              ),
                            ),
                          ),
                        ],
                      ),
                    )),
                const SizedBox(height: 6),
                Container(
                  width: 18,
                  height: 18,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: selected ? accent : AppColors.textMuted,
                      width: 1.5,
                    ),
                    color: selected ? accent : Colors.transparent,
                  ),
                  child: selected
                      ? const Icon(Icons.check_rounded,
                          size: 12, color: Color(0xFF1A1500))
                      : null,
                ),
              ],
            ),
          ),
          if (isMostPopular)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.gold,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text(
                    'الأكثر اختياراً',
                    style: TextStyle(
                      color: Color(0xFF1A1500),
                      fontWeight: FontWeight.w800,
                      fontSize: 9,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  const _SummaryRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 12,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
