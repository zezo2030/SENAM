import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../cubit/provider_application_cubit.dart';
import '../cubit/provider_application_state.dart';
import '../widgets/wizard_step1_company.dart';
import '../widgets/wizard_step2_services.dart';
import '../widgets/wizard_step3_portfolio.dart';
import '../widgets/wizard_step4_subscription.dart';
import 'application_status_page.dart';

/// شاشة "انضمّ كشركة" — wizard من 4 خطوات.
class ProviderApplicationPage extends StatelessWidget {
  const ProviderApplicationPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<ProviderApplicationCubit>()..loadCatalog(),
      child: const _WizardView(),
    );
  }
}

class _WizardView extends StatelessWidget {
  const _WizardView();

  static const _stepLabels = [
    'معلومات الشركة',
    'الخدمات',
    'الأعمال والصور',
    'الاشتراك',
  ];

  void _showError(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: AppColors.error),
    );
  }

  void _onNext(BuildContext context) {
    final cubit = context.read<ProviderApplicationCubit>();
    final err = cubit.validateCurrentStep();
    if (err != null) {
      _showError(context, err);
      return;
    }
    if (cubit.state.currentStep < 3) {
      cubit.nextStep();
    } else {
      cubit.submit();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DarkBackground(
        child: SafeArea(
          child:
              BlocConsumer<ProviderApplicationCubit, ProviderApplicationState>(
            listener: (context, state) {
              if (state.status == ApplicationFormStatus.success &&
                  state.result != null) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(
                    builder: (_) => ApplicationStatusPage(
                      companyId: state.result!.companyId,
                      isFirstView: true,
                    ),
                  ),
                );
              } else if (state.status == ApplicationFormStatus.error &&
                  state.errorMessage != null) {
                _showError(context, state.errorMessage!);
              }
            },
            builder: (context, state) {
              final busy = state.status == ApplicationFormStatus.submitting;
              return Column(
                children: [
                  _Header(),
                  _StepIndicator(
                    currentStep: state.currentStep,
                    labels: _stepLabels,
                  ),
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
                      child: switch (state.currentStep) {
                        0 => const WizardStep1Company(),
                        1 => const WizardStep2Services(),
                        2 => const WizardStep3Portfolio(),
                        _ => const WizardStep4Subscription(),
                      },
                    ),
                  ),
                  _WizardNavBar(
                    currentStep: state.currentStep,
                    busy: busy,
                    onNext: () => _onNext(context),
                    onBack: state.currentStep == 0
                        ? null
                        : () => context
                            .read<ProviderApplicationCubit>()
                            .previousStep(),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 12),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Align(
            alignment: AlignmentDirectional.centerStart,
            child: IconButton(
              icon: const Icon(Icons.arrow_forward_rounded,
                  color: AppColors.textPrimary),
              onPressed: () => Navigator.maybePop(context),
            ),
          ),
          Column(
            children: const [
              Text(
                'انضم كشركة',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              SizedBox(height: 4),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 60),
                child: Text(
                  'قدّم طلبك للانضمام لمنصة سنام كمزود خدمة. سيتم مراجعتنا قبل تفعيل حسابك.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StepIndicator extends StatelessWidget {
  final int currentStep;
  final List<String> labels;

  const _StepIndicator({required this.currentStep, required this.labels});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Row(
        children: [
          for (var i = 0; i < labels.length; i++) ...[
            Expanded(
              child: Column(
                children: [
                  _StepDot(
                    index: i + 1,
                    active: i == currentStep,
                    completed: i < currentStep,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    labels[i],
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: i == currentStep
                          ? FontWeight.w800
                          : FontWeight.w500,
                      color: i == currentStep
                          ? AppColors.gold
                          : AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            if (i < labels.length - 1)
              Padding(
                padding: const EdgeInsets.only(bottom: 28),
                child: Container(
                  width: 18,
                  height: 1,
                  color: i < currentStep
                      ? AppColors.gold
                      : AppColors.textMuted.withValues(alpha: 0.3),
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class _StepDot extends StatelessWidget {
  final int index;
  final bool active;
  final bool completed;

  const _StepDot({
    required this.index,
    required this.active,
    required this.completed,
  });

  @override
  Widget build(BuildContext context) {
    final highlighted = active || completed;
    return Container(
      width: 30,
      height: 30,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: highlighted ? AppColors.gold : Colors.transparent,
        border: Border.all(
          color: highlighted ? AppColors.gold : AppColors.textMuted,
          width: 1.5,
        ),
      ),
      child: completed
          ? const Icon(Icons.check_rounded, size: 16, color: Color(0xFF1A1500))
          : Text(
              '$index',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: highlighted
                    ? const Color(0xFF1A1500)
                    : AppColors.textMuted,
              ),
            ),
    );
  }
}

class _WizardNavBar extends StatelessWidget {
  final int currentStep;
  final bool busy;
  final VoidCallback onNext;
  final VoidCallback? onBack;

  const _WizardNavBar({
    required this.currentStep,
    required this.busy,
    required this.onNext,
    this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    final isLast = currentStep == 3;
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.25),
        border: Border(
          top: BorderSide(
            color: AppColors.textMuted.withValues(alpha: 0.15),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          if (onBack != null)
            Expanded(
              child: OutlinedButton(
                onPressed: busy ? null : onBack,
                style: OutlinedButton.styleFrom(
                  side: BorderSide(
                    color: AppColors.textMuted.withValues(alpha: 0.4),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text(
                  'السابق',
                  style: TextStyle(color: AppColors.textPrimary),
                ),
              ),
            ),
          if (onBack != null) const SizedBox(width: 10),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: busy ? null : onNext,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.gold,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: busy
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: Color(0xFF1A1500),
                      ),
                    )
                  : Text(
                      isLast ? 'إرسال الطلب' : 'التالي',
                      style: const TextStyle(
                        color: Color(0xFF1A1500),
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Shared helpers used by step widgets ──────────────────────────────────

class WizardFilePicker {
  /// نسأل المستخدم ملف ونرجع File + contentType + fileName، أو null لو ألغى.
  static Future<({File file, String contentType, String fileName})?> pick({
    required BuildContext context,
    bool imagesOnly = false,
  }) async {
    try {
      final picked = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: imagesOnly
            ? ['jpg', 'jpeg', 'png', 'webp', 'heic']
            : ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'heic'],
        withData: false,
      );
      if (picked == null || picked.files.isEmpty) return null;
      final pickedFile = picked.files.single;
      final path = pickedFile.path;
      if (path == null) return null;
      final ext = pickedFile.extension?.toLowerCase() ?? '';
      final contentType = _contentTypeForExt(ext);
      return (
        file: File(path),
        contentType: contentType,
        fileName: pickedFile.name,
      );
    } catch (_) {
      return null;
    }
  }

  static String _contentTypeForExt(String ext) {
    switch (ext) {
      case 'pdf':
        return 'application/pdf';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'heic':
        return 'image/heic';
      default:
        return 'image/jpeg';
    }
  }
}

class WizardSectionTitle extends StatelessWidget {
  final String text;
  final String? subtitle;
  const WizardSectionTitle(this.text, {this.subtitle, super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(width: 3, height: 18, color: AppColors.gold),
              const SizedBox(width: 10),
              Text(
                text,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Padding(
              padding: const EdgeInsetsDirectional.only(start: 13),
              child: Text(
                subtitle!,
                style: const TextStyle(
                    color: AppColors.textMuted, fontSize: 12),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class WizardLabel extends StatelessWidget {
  final String text;
  final bool required;
  const WizardLabel(this.text, {this.required = false, super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6, top: 4),
      child: Row(
        children: [
          Text(
            text,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
          if (required)
            const Padding(
              padding: EdgeInsetsDirectional.only(start: 4),
              child: Text('*',
                  style: TextStyle(
                      color: AppColors.gold,
                      fontWeight: FontWeight.w900,
                      fontSize: 13)),
            ),
        ],
      ),
    );
  }
}
