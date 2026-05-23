import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../cubit/provider_application_cubit.dart';
import '../cubit/provider_application_state.dart';
import '../pages/provider_application_page.dart';

const _regions = ['الدوحة', 'الوكرة', 'الريان', 'أم صلال', 'الخور', 'الشمال'];

const _citiesByRegion = <String, List<String>>{
  'الدوحة': ['الدوحة', 'مشيرب', 'الدفنة', 'الوعب'],
  'الوكرة': ['الوكرة', 'الوكير'],
  'الريان': ['الريان', 'معيذر'],
  'أم صلال': ['أم صلال محمد', 'أم صلال علي'],
  'الخور': ['الخور'],
  'الشمال': ['الشمال', 'الرويس'],
};

class WizardStep1Company extends StatelessWidget {
  const WizardStep1Company({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ProviderApplicationCubit, ProviderApplicationState>(
      buildWhen: (a, b) =>
          a.legalName != b.legalName ||
          a.displayName != b.displayName ||
          a.slug != b.slug ||
          a.logoObjectKey != b.logoObjectKey ||
          a.logoFileName != b.logoFileName ||
          a.categoryId != b.categoryId ||
          a.categories != b.categories ||
          a.hasCommercialRegistration != b.hasCommercialRegistration ||
          a.commercialRegistrationNo != b.commercialRegistrationNo ||
          a.description != b.description ||
          a.phone != b.phone ||
          a.email != b.email ||
          a.website != b.website ||
          a.instagram != b.instagram ||
          a.region != b.region ||
          a.city != b.city ||
          a.consentAccepted != b.consentAccepted ||
          a.ownerPassword != b.ownerPassword ||
          a.uploadingSlot != b.uploadingSlot,
      builder: (context, state) {
        final cubit = context.read<ProviderApplicationCubit>();
        final uploadingLogo = state.uploadingSlot == UploadingSlot.logo;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const WizardSectionTitle('معلومات الشركة'),

            // ── Logo upload tile ────────────────────────────────────────
            const WizardLabel('شعار الشركة'),
            const Padding(
              padding: EdgeInsets.only(bottom: 8),
              child: Text(
                'يفضّل أن يكون الشعار واضح بجودة عالية',
                style: TextStyle(color: AppColors.textMuted, fontSize: 11),
              ),
            ),
            _LogoUploadTile(
              hasLogo: state.logoObjectKey != null,
              fileName: state.logoFileName,
              uploading: uploadingLogo,
              onPick: () async {
                final res = await WizardFilePicker.pick(
                  context: context, imagesOnly: true);
                if (res == null || !context.mounted) return;
                await cubit.uploadLogo(
                  file: res.file,
                  contentType: res.contentType,
                  fileName: res.fileName,
                );
              },
              onRemove: cubit.removeLogo,
            ),
            const SizedBox(height: 16),

            // ── Legal name ──────────────────────────────────────────────
            const WizardLabel('الاسم القانوني للشركة', required: true),
            TextField(
              decoration: const InputDecoration(
                hintText: 'مثال: شركة النور للتجارة والمقاولات',
                prefixIcon: Icon(Icons.business_outlined,
                    color: AppColors.textMuted),
              ),
              onChanged: cubit.setLegalName,
            ),
            const SizedBox(height: 12),

            // ── Display name ────────────────────────────────────────────
            const WizardLabel('الاسم التجاري المعروض', required: true),
            TextField(
              decoration: const InputDecoration(
                hintText: 'مثال: النور للخدمات',
                prefixIcon: Icon(Icons.storefront_outlined,
                    color: AppColors.textMuted),
              ),
              onChanged: cubit.setDisplayName,
            ),
            const SizedBox(height: 12),

            // ── Main service category + slug ───────────────────────────
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const WizardLabel('نوع الخدمة الرئيسي', required: true),
                      DropdownButtonFormField<String>(
                        value: state.categoryId,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          hintText: 'اختر نوع الخدمة',
                          prefixIcon: Icon(Icons.category_outlined,
                              color: AppColors.textMuted),
                        ),
                        items: [
                          for (final c in state.categories)
                            DropdownMenuItem(
                              value: c.id,
                              child: Text(c.nameAr,
                                  overflow: TextOverflow.ellipsis),
                            ),
                        ],
                        onChanged: cubit.setCategoryId,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const WizardLabel('المعرّف الفريد (slug)',
                          required: true),
                      TextField(
                        textDirection: TextDirection.ltr,
                        autocorrect: false,
                        enableSuggestions: false,
                        decoration: const InputDecoration(
                          hintText: 'alnoor-services',
                          prefixIcon: Icon(Icons.link_outlined,
                              color: AppColors.textMuted),
                        ),
                        onChanged: cubit.setSlug,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // ── Commercial registration ────────────────────────────────
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const WizardLabel('رقم السجل التجاري'),
                      TextField(
                        keyboardType: TextInputType.number,
                        textDirection: TextDirection.ltr,
                        decoration: const InputDecoration(
                          hintText: '123456',
                          prefixIcon: Icon(Icons.badge_outlined,
                              color: AppColors.textMuted),
                        ),
                        onChanged: cubit.setCommercialRegistrationNo,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const WizardLabel('هل لديك سجل تجاري؟', required: true),
                      Row(
                        children: [
                          _YesNoRadio(
                            label: 'نعم',
                            value: true,
                            current: state.hasCommercialRegistration,
                            onTap: () =>
                                cubit.setHasCommercialRegistration(true),
                          ),
                          const SizedBox(width: 14),
                          _YesNoRadio(
                            label: 'لا',
                            value: false,
                            current: state.hasCommercialRegistration,
                            onTap: () =>
                                cubit.setHasCommercialRegistration(false),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // ── Description ────────────────────────────────────────────
            const WizardLabel('وصف مختصر عن شركتك', required: true),
            TextField(
              maxLines: 3,
              maxLength: 300,
              decoration: const InputDecoration(
                hintText:
                    'اكتب نبذة مختصرة عن شركتك، خدماتكم، خبراتكم، ما يميّزكم...',
              ),
              onChanged: cubit.setDescription,
            ),

            const SizedBox(height: 8),
            const WizardSectionTitle('معلومات التواصل'),

            // ── Phone + Email ──────────────────────────────────────────
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const WizardLabel('رقم الجوال / واتساب', required: true),
                      TextField(
                        keyboardType: TextInputType.phone,
                        textDirection: TextDirection.ltr,
                        decoration: const InputDecoration(
                          hintText: '+974 55 123 456',
                          prefixIcon: Icon(Icons.chat_outlined,
                              color: AppColors.textMuted),
                        ),
                        onChanged: cubit.setPhone,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const WizardLabel('البريد الإلكتروني', required: true),
                      TextField(
                        keyboardType: TextInputType.emailAddress,
                        textDirection: TextDirection.ltr,
                        decoration: const InputDecoration(
                          hintText: 'info@company.com',
                          prefixIcon: Icon(Icons.email_outlined,
                              color: AppColors.textMuted),
                        ),
                        onChanged: cubit.setEmail,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // ── Instagram + Website ────────────────────────────────────
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const WizardLabel('حساب الإنستغرام'),
                      TextField(
                        textDirection: TextDirection.ltr,
                        decoration: const InputDecoration(
                          hintText: '@company',
                          prefixIcon: Icon(Icons.camera_alt_outlined,
                              color: AppColors.textMuted),
                        ),
                        onChanged: cubit.setInstagram,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const WizardLabel('الموقع الإلكتروني (اختياري)'),
                      TextField(
                        textDirection: TextDirection.ltr,
                        decoration: const InputDecoration(
                          hintText: 'www.company.com',
                          prefixIcon: Icon(Icons.public_outlined,
                              color: AppColors.textMuted),
                        ),
                        onChanged: cubit.setWebsite,
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 8),
            const WizardSectionTitle('موقع الشركة'),

            // ── Region + City ──────────────────────────────────────────
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const WizardLabel('المنطقة', required: true),
                      DropdownButtonFormField<String>(
                        value: state.region.isEmpty ? null : state.region,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          hintText: 'اختر المنطقة',
                        ),
                        items: [
                          for (final r in _regions)
                            DropdownMenuItem(value: r, child: Text(r)),
                        ],
                        onChanged: (v) {
                          cubit.setRegion(v);
                          cubit.setCity(null);
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const WizardLabel('المدينة', required: true),
                      DropdownButtonFormField<String>(
                        value: state.city.isEmpty ? null : state.city,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          hintText: 'اختر المدينة',
                        ),
                        items: [
                          for (final c
                              in _citiesByRegion[state.region] ?? const <String>[])
                            DropdownMenuItem(value: c, child: Text(c)),
                        ],
                        onChanged: cubit.setCity,
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 18),
            const WizardSectionTitle('حساب الدخول للشركة'),
            const WizardLabel('كلمة المرور (حساب لوحة المزود)',
                required: true),
            TextField(
              obscureText: true,
              textDirection: TextDirection.ltr,
              decoration: const InputDecoration(
                hintText: '8 أحرف على الأقل',
                prefixIcon:
                    Icon(Icons.lock_outline, color: AppColors.textMuted),
              ),
              onChanged: cubit.setOwnerPassword,
            ),

            const SizedBox(height: 16),
            // ── Consent ────────────────────────────────────────────────
            InkWell(
              onTap: () => cubit.setConsent(!state.consentAccepted),
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(6),
                        color: state.consentAccepted
                            ? AppColors.gold
                            : Colors.transparent,
                        border: Border.all(
                          color: state.consentAccepted
                              ? AppColors.gold
                              : AppColors.textMuted,
                          width: 1.5,
                        ),
                      ),
                      child: state.consentAccepted
                          ? const Icon(Icons.check_rounded,
                              size: 16, color: Color(0xFF1A1500))
                          : null,
                    ),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Text(
                        'أتعهد بأن جميع المعلومات المقدمة صحيحة',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _LogoUploadTile extends StatelessWidget {
  final bool hasLogo;
  final String? fileName;
  final bool uploading;
  final VoidCallback onPick;
  final VoidCallback onRemove;

  const _LogoUploadTile({
    required this.hasLogo,
    required this.fileName,
    required this.uploading,
    required this.onPick,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: uploading ? null : onPick,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        height: 110,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          color: AppColors.surfaceLight.withValues(alpha: 0.4),
          border: Border.all(
            color: hasLogo
                ? AppColors.gold.withValues(alpha: 0.6)
                : AppColors.gold.withValues(alpha: 0.3),
            width: 1.5,
            style: BorderStyle.solid,
          ),
        ),
        alignment: Alignment.center,
        child: uploading
            ? const CircularProgressIndicator(
                color: AppColors.gold, strokeWidth: 2.4)
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    hasLogo
                        ? Icons.check_circle_outline
                        : Icons.cloud_upload_outlined,
                    size: 30,
                    color: AppColors.gold,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    hasLogo ? (fileName ?? 'تم رفع الشعار') : 'رفع الشعار',
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (!hasLogo) ...[
                    const SizedBox(height: 2),
                    const Text(
                      'PNG, JPG - الأقصى 2MB',
                      style:
                          TextStyle(color: AppColors.textMuted, fontSize: 11),
                    ),
                  ] else
                    TextButton(
                      onPressed: onRemove,
                      child: const Text(
                        'إزالة',
                        style: TextStyle(color: AppColors.error, fontSize: 11),
                      ),
                    ),
                ],
              ),
      ),
    );
  }
}

class _YesNoRadio extends StatelessWidget {
  final String label;
  final bool value;
  final bool current;
  final VoidCallback onTap;
  const _YesNoRadio({
    required this.label,
    required this.value,
    required this.current,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final selected = value == current;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 18,
            height: 18,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: selected ? AppColors.gold : AppColors.textMuted,
                width: 1.5,
              ),
            ),
            child: selected
                ? Center(
                    child: Container(
                      width: 9,
                      height: 9,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.gold,
                      ),
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
