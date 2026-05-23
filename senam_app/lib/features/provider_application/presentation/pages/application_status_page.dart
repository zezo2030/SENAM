import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../domain/entities/application_status.dart';
import '../cubit/provider_application_cubit.dart';
import '../cubit/provider_application_state.dart';

/// شاشة عرض حالة طلب شركة (تستخدم بعد التقديم أو بمعرّف الشركة).
class ApplicationStatusPage extends StatelessWidget {
  final String companyId;
  final bool isFirstView;

  const ApplicationStatusPage({
    super.key,
    required this.companyId,
    this.isFirstView = false,
  });

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) =>
          sl<ProviderApplicationCubit>()..fetchStatus(companyId),
      child: _StatusView(companyId: companyId, isFirstView: isFirstView),
    );
  }
}

class _StatusView extends StatelessWidget {
  final String companyId;
  final bool isFirstView;

  const _StatusView({required this.companyId, required this.isFirstView});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DarkBackground(
        child: SafeArea(
          child:
              BlocBuilder<ProviderApplicationCubit, ProviderApplicationState>(
            builder: (context, state) {
              final loading =
                  state.status == ApplicationFormStatus.submitting &&
                      state.lookup == null;
              final lookup = state.lookup;

              return RefreshIndicator(
                color: AppColors.gold,
                onRefresh: () =>
                    context.read<ProviderApplicationCubit>().fetchStatus(companyId),
                child: ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.arrow_forward_rounded,
                              color: AppColors.textPrimary),
                          onPressed: () => Navigator.pop(context),
                        ),
                        const Spacer(),
                        if (!loading)
                          IconButton(
                            icon: const Icon(Icons.refresh,
                                color: AppColors.textPrimary),
                            onPressed: () => context
                                .read<ProviderApplicationCubit>()
                                .fetchStatus(companyId),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (isFirstView)
                      _SuccessBanner(companyId: companyId),
                    const SizedBox(height: 24),
                    if (loading)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 60),
                        child: LoadingView(),
                      )
                    else if (state.status == ApplicationFormStatus.error)
                      ErrorView(
                        message: state.errorMessage ?? 'تعذّر جلب حالة الطلب',
                        onRetry: () => context
                            .read<ProviderApplicationCubit>()
                            .fetchStatus(companyId),
                      )
                    else if (lookup != null) ...[
                      _StatusCard(lookup: lookup),
                      const SizedBox(height: 20),
                      _CompanyIdCard(companyId: lookup.companyId),
                      const SizedBox(height: 20),
                      const _NextStepsCard(),
                    ],
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _SuccessBanner extends StatelessWidget {
  final String companyId;
  const _SuccessBanner({required this.companyId});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.success.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.success.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle_outline,
              color: AppColors.success, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'تم استلام طلبك',
                  style: TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 15),
                ),
                SizedBox(height: 4),
                Text(
                  'سيتم مراجعته من قبل فريقنا. ستصلك إشعارات عند تغير الحالة.',
                  style: TextStyle(
                      color: AppColors.textSecondary, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  final CompanyApplicationStatus lookup;
  const _StatusCard({required this.lookup});

  @override
  Widget build(BuildContext context) {
    final (label, color, icon, description) = switch (lookup.status) {
      ApplicationStatus.pending => (
          'قيد المراجعة',
          AppColors.warning,
          Icons.hourglass_empty,
          'طلبك تحت المراجعة من فريقنا. عادةً تستغرق المراجعة من 24 إلى 48 ساعة عمل.',
        ),
      ApplicationStatus.active => (
          'مفعّلة',
          AppColors.success,
          Icons.verified_outlined,
          'تم قبول طلبكم! يمكنكم الآن تسجيل الدخول كمزود خدمة وإكمال إعداد الشركة.',
        ),
      ApplicationStatus.suspended => (
          'موقوفة',
          AppColors.error,
          Icons.block_outlined,
          'تم تعليق حساب الشركة. الرجاء التواصل مع الدعم لمعرفة التفاصيل.',
        ),
    };

    return GradientCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 54,
                height: 54,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: color, size: 30),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'حالة الطلب',
                      style: TextStyle(
                          color: AppColors.textMuted, fontSize: 12),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      label,
                      style: TextStyle(
                          color: color,
                          fontWeight: FontWeight.w800,
                          fontSize: 20),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            description,
            style: const TextStyle(
                color: AppColors.textSecondary, fontSize: 13, height: 1.6),
          ),
          const SizedBox(height: 16),
          _MetaRow(
            label: 'تاريخ التقديم',
            value: _formatDate(lookup.submittedAt),
          ),
          if (lookup.approvedAt != null) ...[
            const SizedBox(height: 8),
            _MetaRow(
              label: 'تاريخ الموافقة',
              value: _formatDate(lookup.approvedAt!),
            ),
          ],
        ],
      ),
    );
  }
}

class _CompanyIdCard extends StatelessWidget {
  final String companyId;
  const _CompanyIdCard({required this.companyId});

  @override
  Widget build(BuildContext context) {
    return GradientCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'معرّف الشركة',
            style: TextStyle(color: AppColors.textMuted, fontSize: 12),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Expanded(
                child: Text(
                  companyId,
                  textDirection: TextDirection.ltr,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontFamily: 'monospace',
                    fontSize: 13,
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.copy_outlined,
                    color: AppColors.gold, size: 20),
                tooltip: 'نسخ',
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: companyId));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('تم نسخ المعرّف'),
                      duration: Duration(seconds: 2),
                    ),
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'احتفظ بهذا المعرّف لمتابعة طلبك لاحقاً',
            style: TextStyle(color: AppColors.textMuted, fontSize: 11),
          ),
        ],
      ),
    );
  }
}

class _NextStepsCard extends StatelessWidget {
  const _NextStepsCard();

  @override
  Widget build(BuildContext context) {
    return GradientCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Text(
            'الخطوات التالية',
            style: TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w800,
                fontSize: 15),
          ),
          SizedBox(height: 12),
          _Step(
            icon: Icons.fact_check_outlined,
            text: 'يتحقق فريقنا من الوثائق المُرفقة',
          ),
          _Step(
            icon: Icons.mark_email_unread_outlined,
            text: 'تصلكم إشعارات بتغيّر الحالة',
          ),
          _Step(
            icon: Icons.login_outlined,
            text: 'بعد الموافقة، سجّلوا الدخول بحساب المالك من شاشة الدخول',
          ),
        ],
      ),
    );
  }
}

class _Step extends StatelessWidget {
  final IconData icon;
  final String text;
  const _Step({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.gold, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  final String label;
  final String value;
  const _MetaRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(label,
            style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
        const Spacer(),
        Text(value,
            style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 12,
                fontWeight: FontWeight.w700)),
      ],
    );
  }
}

String _formatDate(DateTime d) {
  String two(int n) => n.toString().padLeft(2, '0');
  return '${d.year}-${two(d.month)}-${two(d.day)}  ${two(d.hour)}:${two(d.minute)}';
}
