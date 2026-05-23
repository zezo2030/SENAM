import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/kyc_document.dart';
import '../cubit/provider_application_cubit.dart';
import '../cubit/provider_application_state.dart';
import '../pages/provider_application_page.dart';

class WizardStep3Portfolio extends StatelessWidget {
  const WizardStep3Portfolio({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ProviderApplicationCubit, ProviderApplicationState>(
      buildWhen: (a, b) =>
          a.portfolioPhotos != b.portfolioPhotos ||
          a.uploadingSlot != b.uploadingSlot ||
          a.uploadingKind != b.uploadingKind ||
          a.documents != b.documents ||
          a.landline != b.landline ||
          a.whatsappLink != b.whatsappLink ||
          a.additionalNotes != b.additionalNotes,
      builder: (context, state) {
        final cubit = context.read<ProviderApplicationCubit>();
        final canAddMore = state.portfolioPhotos.length < 10;
        final uploadingPortfolio =
            state.uploadingSlot == UploadingSlot.portfolio;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const WizardSectionTitle(
              'أعمال سابقة',
              subtitle: 'أضف صوراً لأعمالك السابقة (قبل/بعد إن أمكن)',
            ),

            // ── Top "Add photos" hero tile ─────────────────────────────
            InkWell(
              onTap: !canAddMore || uploadingPortfolio
                  ? null
                  : () async {
                      final res = await WizardFilePicker.pick(
                          context: context, imagesOnly: true);
                      if (res == null || !context.mounted) return;
                      await cubit.addPortfolioPhoto(
                        file: res.file,
                        contentType: res.contentType,
                        fileName: res.fileName,
                      );
                    },
              borderRadius: BorderRadius.circular(14),
              child: Container(
                height: 96,
                decoration: BoxDecoration(
                  color: AppColors.surfaceLight.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: AppColors.gold.withValues(alpha: 0.5),
                    width: 1.4,
                  ),
                ),
                alignment: Alignment.center,
                child: uploadingPortfolio
                    ? const CircularProgressIndicator(
                        color: AppColors.gold, strokeWidth: 2.4)
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.add_a_photo_outlined,
                              color: AppColors.gold, size: 26),
                          SizedBox(height: 6),
                          Text(
                            'إضافة صور',
                            style: TextStyle(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'بإمكانك رفع حتى 10 صور . JPG, PNG',
                            style: TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
              ),
            ),

            const SizedBox(height: 12),

            // ── Existing photos grid ───────────────────────────────────
            if (state.portfolioPhotos.isNotEmpty || canAddMore)
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate:
                    const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 4,
                  mainAxisSpacing: 8,
                  crossAxisSpacing: 8,
                ),
                itemCount: state.portfolioPhotos.length + (canAddMore ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == state.portfolioPhotos.length) {
                    return _AddPhotoTile(
                      uploading: uploadingPortfolio,
                      onTap: () async {
                        final res = await WizardFilePicker.pick(
                            context: context, imagesOnly: true);
                        if (res == null || !context.mounted) return;
                        await cubit.addPortfolioPhoto(
                          file: res.file,
                          contentType: res.contentType,
                          fileName: res.fileName,
                        );
                      },
                    );
                  }
                  return _PortfolioThumb(
                    photo: state.portfolioPhotos[index],
                    onRemove: () => cubit.removePortfolioPhoto(index),
                  );
                },
              ),

            const SizedBox(height: 18),
            const WizardSectionTitle('وسائل التواصل الإضافية (اختياري)'),

            const WizardLabel('رقم الهاتف الثابت'),
            TextField(
              keyboardType: TextInputType.phone,
              textDirection: TextDirection.ltr,
              decoration: const InputDecoration(
                hintText: '40123456',
                prefixIcon: Icon(Icons.phone_outlined,
                    color: AppColors.textMuted),
              ),
              onChanged: cubit.setLandline,
            ),
            const SizedBox(height: 12),

            const WizardLabel('تواصل واتساب مباشر'),
            TextField(
              textDirection: TextDirection.ltr,
              decoration: const InputDecoration(
                hintText: 'https://wa.me/97455123456',
                prefixIcon: Icon(Icons.chat_outlined,
                    color: AppColors.textMuted),
              ),
              onChanged: cubit.setWhatsappLink,
            ),
            const SizedBox(height: 12),

            const WizardLabel('ملاحظات إضافية'),
            TextField(
              maxLines: 4,
              maxLength: 200,
              decoration: const InputDecoration(
                hintText: 'أي معلومات إضافية تود مشاركتها...',
              ),
              onChanged: cubit.setAdditionalNotes,
            ),

            const SizedBox(height: 18),
            const WizardSectionTitle(
              'وثائق التحقق (KYC)',
              subtitle:
                  'مطلوب على الأقل: السجل التجاري + هوية المالك',
            ),
            ...KycDocumentKind.values.map(
              (kind) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _DocumentTile(
                  kind: kind,
                  state: state,
                  onPick: () async {
                    final res = await WizardFilePicker.pick(
                        context: context);
                    if (res == null || !context.mounted) return;
                    await cubit.pickAndUpload(
                      kind: kind,
                      file: res.file,
                      contentType: res.contentType,
                      fileName: res.fileName,
                    );
                  },
                  onRemove: () => cubit.removeDocument(kind),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _AddPhotoTile extends StatelessWidget {
  final VoidCallback onTap;
  final bool uploading;
  const _AddPhotoTile({required this.onTap, required this.uploading});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: uploading ? null : onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppColors.gold.withValues(alpha: 0.5),
            width: 1.4,
          ),
        ),
        alignment: Alignment.center,
        child: uploading
            ? const CircularProgressIndicator(
                color: AppColors.gold, strokeWidth: 2.2)
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(Icons.add_rounded, color: AppColors.gold, size: 26),
                  SizedBox(height: 2),
                  Text(
                    'إضافة المزيد',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _PortfolioThumb extends StatelessWidget {
  final PortfolioPhoto photo;
  final VoidCallback onRemove;
  const _PortfolioThumb({required this.photo, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          decoration: BoxDecoration(
            color: AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: AppColors.textMuted.withValues(alpha: 0.25),
            ),
          ),
          alignment: Alignment.center,
          padding: const EdgeInsets.all(8),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.image_outlined,
                  color: AppColors.gold, size: 26),
              const SizedBox(height: 4),
              Text(
                photo.fileName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 9,
                ),
              ),
            ],
          ),
        ),
        PositionedDirectional(
          top: 4,
          end: 4,
          child: InkWell(
            onTap: onRemove,
            child: Container(
              padding: const EdgeInsets.all(3),
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.black54,
              ),
              child: const Icon(Icons.close_rounded,
                  size: 14, color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }
}

class _DocumentTile extends StatelessWidget {
  final KycDocumentKind kind;
  final ProviderApplicationState state;
  final VoidCallback onPick;
  final VoidCallback onRemove;

  const _DocumentTile({
    required this.kind,
    required this.state,
    required this.onPick,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final uploaded = state.documents[kind];
    final isUploading = state.uploadingKind == kind &&
        state.status == ApplicationFormStatus.uploading;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceLight.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: uploaded != null
              ? AppColors.success.withValues(alpha: 0.45)
              : AppColors.textMuted.withValues(alpha: 0.25),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: uploaded != null
                  ? AppColors.success.withValues(alpha: 0.18)
                  : AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(10),
            ),
            alignment: Alignment.center,
            child: Icon(
              uploaded != null
                  ? Icons.check_circle_outline
                  : Icons.description_outlined,
              size: 20,
              color: uploaded != null
                  ? AppColors.success
                  : AppColors.textSecondary,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        kind.labelAr,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                    ),
                    if (kind.isRequired)
                      const Text(
                        '*',
                        style: TextStyle(
                          color: AppColors.gold,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  uploaded != null
                      ? uploaded.fileName
                      : (isUploading
                          ? 'جاري الرفع…'
                          : 'لم يتم الرفع بعد'),
                  style: TextStyle(
                    color: uploaded != null
                        ? AppColors.textSecondary
                        : AppColors.textMuted,
                    fontSize: 11,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (isUploading)
            const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2.2, color: AppColors.gold),
            )
          else if (uploaded != null)
            IconButton(
              icon: const Icon(Icons.close_rounded,
                  color: AppColors.textMuted, size: 18),
              onPressed: onRemove,
            )
          else
            TextButton(
              onPressed: onPick,
              child: const Text(
                'اختر ملف',
                style: TextStyle(
                  color: AppColors.gold,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
