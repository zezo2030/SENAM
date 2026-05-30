import 'dart:io';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/datasources/application_local_storage.dart';
import '../../domain/entities/kyc_document.dart';
import '../../domain/repositories/provider_application_repository.dart';
import '../../domain/usecases/get_application_status.dart';
import '../../domain/usecases/submit_application.dart';
import '../../domain/usecases/upload_document.dart';
import 'provider_application_state.dart';

class ProviderApplicationCubit extends Cubit<ProviderApplicationState> {
  final UploadDocument uploadDocumentUseCase;
  final SubmitApplication submitApplicationUseCase;
  final GetApplicationStatus getStatusUseCase;
  final ApplicationLocalStorage localStorage;
  final ProviderApplicationRepository repository;

  ProviderApplicationCubit({
    required this.uploadDocumentUseCase,
    required this.submitApplicationUseCase,
    required this.getStatusUseCase,
    required this.localStorage,
    required this.repository,
  }) : super(const ProviderApplicationState());

  // ─── Catalog loading ───────────────────────────────────────────────────

  Future<void> loadCatalog() async {
    if (state.catalogLoading || state.services.isNotEmpty) return;
    emit(state.copyWith(catalogLoading: true, clearError: true));

    final categoriesResult = await repository.fetchCategories();
    final servicesResult = await repository.fetchServices();

    categoriesResult.fold(
      (_) => null,
      (categories) => emit(state.copyWith(categories: categories)),
    );
    servicesResult.fold(
      (failure) => emit(state.copyWith(
        catalogLoading: false,
        status: ApplicationFormStatus.error,
        errorMessage: failure.message,
      )),
      (services) => emit(state.copyWith(
        services: services,
        catalogLoading: false,
      )),
    );
  }

  // ─── Local helpers ─────────────────────────────────────────────────────

  Future<String?> rememberedCompanyId() => localStorage.read();
  Future<void> forgetRememberedApplication() => localStorage.clear();

  // ─── Step navigation ───────────────────────────────────────────────────

  void goToStep(int step) =>
      emit(state.copyWith(currentStep: step.clamp(0, 2), clearError: true));

  void nextStep() =>
      emit(state.copyWith(currentStep: (state.currentStep + 1).clamp(0, 2)));

  void previousStep() =>
      emit(state.copyWith(currentStep: (state.currentStep - 1).clamp(0, 2)));

  // ─── Field setters (step 1) ────────────────────────────────────────────

  void setLegalName(String v) => emit(state.copyWith(legalName: v));
  void setDisplayName(String v) => emit(state.copyWith(displayName: v));
  void setSlug(String v) =>
      emit(state.copyWith(slug: v.trim().toLowerCase()));
  void setCategoryId(String? id) {
    if (state.categoryId == id) return;
    emit(state.copyWith(
      categoryId: id,
      selectedServiceIds: const <String>{},
    ));
  }
  void setHasCommercialRegistration(bool v) =>
      emit(state.copyWith(hasCommercialRegistration: v));
  void setCommercialRegistrationNo(String v) =>
      emit(state.copyWith(commercialRegistrationNo: v));
  void setDescription(String v) => emit(state.copyWith(description: v));
  void setPhone(String v) => emit(state.copyWith(phone: v));
  void setEmail(String v) => emit(state.copyWith(email: v));
  void setWebsite(String v) => emit(state.copyWith(website: v));
  void setInstagram(String v) => emit(state.copyWith(instagram: v));
  void setRegion(String? v) => emit(state.copyWith(region: v ?? ''));
  void setCity(String? v) => emit(state.copyWith(city: v ?? ''));
  void setConsent(bool v) => emit(state.copyWith(consentAccepted: v));

  // ─── Field setters (step 2) ────────────────────────────────────────────

  void toggleService(String id) {
    final next = Set<String>.from(state.selectedServiceIds);
    if (next.contains(id)) {
      next.remove(id);
    } else {
      next.add(id);
    }
    emit(state.copyWith(selectedServiceIds: next));
  }

  void setCustomServiceText(String v) =>
      emit(state.copyWith(customServiceText: v));

  // ─── Field setters (step 3) ────────────────────────────────────────────

  void setLandline(String v) => emit(state.copyWith(landline: v));
  void setWhatsappLink(String v) => emit(state.copyWith(whatsappLink: v));
  void setAdditionalNotes(String v) =>
      emit(state.copyWith(additionalNotes: v));

  void removePortfolioPhoto(int index) {
    if (index < 0 || index >= state.portfolioPhotos.length) return;
    final next = List<PortfolioPhoto>.from(state.portfolioPhotos)
      ..removeAt(index);
    final renumbered = <PortfolioPhoto>[];
    for (var i = 0; i < next.length; i++) {
      renumbered.add(PortfolioPhoto(
        objectKey: next[i].objectKey,
        fileName: next[i].fileName,
        sortOrder: i,
      ));
    }
    emit(state.copyWith(portfolioPhotos: renumbered));
  }

  // ─── Field setters (step 4) ────────────────────────────────────────────

  void setSubscriptionPlan(SubscriptionPlanTier plan) =>
      emit(state.copyWith(subscriptionPlan: plan));

  void setSubscriptionPeriod(SubscriptionBillingPeriod period) =>
      emit(state.copyWith(subscriptionPeriod: period));

  // ─── Owner creds ───────────────────────────────────────────────────────

  void setOwnerDisplayName(String v) =>
      emit(state.copyWith(ownerDisplayName: v));
  void setOwnerPassword(String v) => emit(state.copyWith(ownerPassword: v));

  // ─── Uploads ───────────────────────────────────────────────────────────

  Future<void> uploadLogo({
    required File file,
    required String contentType,
    required String fileName,
  }) async {
    emit(state.copyWith(
      uploadingSlot: UploadingSlot.logo,
      status: ApplicationFormStatus.uploading,
      clearError: true,
    ));

    final result = await repository.uploadFile(
      file: file,
      contentType: contentType,
      purpose: UploadPurpose.companyLogo,
    );

    result.fold(
      (failure) => emit(state.copyWith(
        uploadingSlot: UploadingSlot.none,
        status: ApplicationFormStatus.error,
        errorMessage: 'تعذّر رفع الشعار: ${failure.message}',
      )),
      (objectKey) => emit(state.copyWith(
        logoObjectKey: objectKey,
        logoFileName: fileName,
        uploadingSlot: UploadingSlot.none,
        status: ApplicationFormStatus.idle,
        clearError: true,
      )),
    );
  }

  void removeLogo() => emit(state.copyWith(clearLogo: true));

  Future<void> addPortfolioPhoto({
    required File file,
    required String contentType,
    required String fileName,
  }) async {
    if (state.portfolioPhotos.length >= 10) {
      emit(state.copyWith(
        status: ApplicationFormStatus.error,
        errorMessage: 'الحد الأقصى 10 صور',
      ));
      return;
    }

    emit(state.copyWith(
      uploadingSlot: UploadingSlot.portfolio,
      status: ApplicationFormStatus.uploading,
      clearError: true,
    ));

    final result = await repository.uploadFile(
      file: file,
      contentType: contentType,
      purpose: UploadPurpose.portfolioPhoto,
    );

    result.fold(
      (failure) => emit(state.copyWith(
        uploadingSlot: UploadingSlot.none,
        status: ApplicationFormStatus.error,
        errorMessage: 'تعذّر رفع الصورة: ${failure.message}',
      )),
      (objectKey) {
        final next = List<PortfolioPhoto>.from(state.portfolioPhotos)
          ..add(PortfolioPhoto(
            objectKey: objectKey,
            fileName: fileName,
            sortOrder: state.portfolioPhotos.length,
          ));
        emit(state.copyWith(
          portfolioPhotos: next,
          uploadingSlot: UploadingSlot.none,
          status: ApplicationFormStatus.idle,
          clearError: true,
        ));
      },
    );
  }

  /// رفع وثيقة KYC (يحتفظ بالتوقيع القديم لتوافق الواجهات).
  Future<void> pickAndUpload({
    required KycDocumentKind kind,
    required File file,
    required String contentType,
    required String fileName,
  }) async {
    emit(state.copyWith(
      uploadingKind: kind,
      status: ApplicationFormStatus.uploading,
      clearError: true,
    ));

    final result = await uploadDocumentUseCase(
      file: file,
      contentType: contentType,
    );

    result.fold(
      (failure) => emit(state.copyWith(
        clearUploadingKind: true,
        status: ApplicationFormStatus.error,
        errorMessage: 'تعذّر رفع الملف: ${failure.message}',
      )),
      (objectKey) {
        final updated = Map<KycDocumentKind, KycDocument>.from(state.documents);
        updated[kind] = KycDocument(
          kind: kind,
          objectKey: objectKey,
          fileName: fileName,
        );
        emit(state.copyWith(
          documents: updated,
          clearUploadingKind: true,
          status: ApplicationFormStatus.idle,
          clearError: true,
        ));
      },
    );
  }

  void removeDocument(KycDocumentKind kind) {
    final updated = Map<KycDocumentKind, KycDocument>.from(state.documents);
    updated.remove(kind);
    emit(state.copyWith(documents: updated));
  }

  // ─── Submission ────────────────────────────────────────────────────────

  /// Validate the current step; returns null when valid, else an error message.
  String? validateCurrentStep() {
    switch (state.currentStep) {
      case 0:
        if (state.legalName.trim().length < 2) {
          return 'الاسم القانوني للشركة مطلوب';
        }
        if (state.displayName.trim().length < 2) {
          return 'الاسم التجاري المعروض مطلوب';
        }
        if (!_isValidUuid(state.categoryId)) {
          return 'يرجى اختيار نوع الخدمة الرئيسي';
        }
        if (!RegExp(r'^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$')
            .hasMatch(state.slug)) {
          return 'المعرّف (slug) يجب أن يكون أحرف انجليزية وأرقام وشرطات';
        }
        if (state.description.trim().isEmpty) {
          return 'وصف الشركة مطلوب';
        }
        if (state.phone.trim().isEmpty) {
          return 'رقم الجوال مطلوب';
        }
        if (state.email.trim().isEmpty || !state.email.contains('@')) {
          return 'البريد الإلكتروني غير صحيح';
        }
        if (state.region.trim().isEmpty || state.city.trim().isEmpty) {
          return 'يرجى اختيار المنطقة والمدينة';
        }
        if (state.hasCommercialRegistration &&
            state.commercialRegistrationNo.trim().isEmpty) {
          return 'يرجى إدخال رقم السجل التجاري';
        }
        if (!state.consentAccepted) {
          return 'يجب التعهد بصحة المعلومات';
        }
        if (state.ownerPassword.length < 8) {
          return 'كلمة المرور يجب ألا تقل عن 8 أحرف';
        }
        return null;
      case 1:
        if (state.selectedServiceIds.isEmpty &&
            state.customServiceText.trim().isEmpty) {
          return 'اختر خدمة واحدة على الأقل (أو اكتب خدمة أخرى)';
        }
        return null;
      case 2:
        if (!state.documents.containsKey(KycDocumentKind.commercialRegistration) ||
            !state.documents.containsKey(KycDocumentKind.ownerId)) {
          return 'يجب رفع السجل التجاري وهوية المالك';
        }
        return null;
    }
    return null;
  }

  Future<void> submit() async {
    final ownerEmail = state.email.trim().toLowerCase();
    if (ownerEmail.isEmpty || !ownerEmail.contains('@')) {
      emit(state.copyWith(
        status: ApplicationFormStatus.error,
        errorMessage: 'البريد الإلكتروني للشركة غير صحيح',
      ));
      return;
    }

    emit(state.copyWith(
      status: ApplicationFormStatus.submitting,
      clearError: true,
    ));

    final cleanCategoryId = _validUuidOrNull(state.categoryId);
    final cleanServiceIds = state.selectedServiceIds
        .map((id) => id.trim())
        .where(_isValidUuid)
        .toList();

    final draft = CompanyApplicationDraft(
      legalName: state.legalName.trim(),
      displayName: state.displayName.trim(),
      slug: state.slug.trim().toLowerCase(),
      logoObjectKey: state.logoObjectKey,
      categoryId: cleanCategoryId,
      hasCommercialRegistration: state.hasCommercialRegistration,
      commercialRegistrationNo: state.hasCommercialRegistration
          ? state.commercialRegistrationNo.trim()
          : null,
      description: state.description.trim(),
      phone: state.phone.trim(),
      email: ownerEmail,
      website: state.website.trim(),
      instagram: state.instagram.trim(),
      region: state.region.trim(),
      city: state.city.trim(),
      serviceIds: cleanServiceIds,
      customServiceText: state.customServiceText.trim(),
      portfolioPhotos: state.portfolioPhotos,
      landline: state.landline.trim(),
      whatsappLink: state.whatsappLink.trim(),
      additionalNotes: state.additionalNotes.trim(),
      subscriptionPlan: state.subscriptionPlan,
      subscriptionPeriod: state.subscriptionPeriod,
      subscriptionPrice: _planPriceHalalas(
        state.subscriptionPlan,
        state.subscriptionPeriod,
      ),
      ownerEmail: ownerEmail,
      ownerDisplayName: state.ownerDisplayName.trim(),
      ownerPassword: state.ownerPassword,
      documents: state.documents.values.toList(),
    );

    final result = await submitApplicationUseCase(draft);

    await result.fold(
      (failure) async => emit(state.copyWith(
        status: ApplicationFormStatus.error,
        errorMessage: failure.message,
      )),
      (created) async {
        await localStorage.save(created.companyId);
        emit(state.copyWith(
          status: ApplicationFormStatus.success,
          result: created,
        ));
      },
    );
  }

  Future<void> fetchStatus(String companyId) async {
    emit(state.copyWith(
      status: ApplicationFormStatus.submitting,
      clearError: true,
    ));
    final result = await getStatusUseCase(companyId);
    result.fold(
      (failure) => emit(state.copyWith(
        status: ApplicationFormStatus.error,
        errorMessage: failure.message,
      )),
      (status) => emit(state.copyWith(
        status: ApplicationFormStatus.idle,
        lookup: status,
      )),
    );
  }

  // ─── UUID helpers ──────────────────────────────────────────────────────
  static final RegExp _uuidRegex = RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
  );

  static bool _isValidUuid(String? s) =>
      s != null && _uuidRegex.hasMatch(s.trim());

  static String? _validUuidOrNull(String? s) =>
      _isValidUuid(s) ? s!.trim() : null;

  // ─── Pricing table ─────────────────────────────────────────────────────
  /// السعر المعروض في الـ mockup. مخزّن كـ halalas (1 QAR = 100).
  static int? _planPriceHalalas(
    SubscriptionPlanTier? plan,
    SubscriptionBillingPeriod period,
  ) {
    if (plan == null) return null;
    final monthly = switch (plan) {
      SubscriptionPlanTier.basic => 299,
      SubscriptionPlanTier.pro => 799,
      SubscriptionPlanTier.vip => 1999,
    };
    final qar = switch (period) {
      SubscriptionBillingPeriod.monthly => monthly,
      SubscriptionBillingPeriod.annual => monthly * 10, // ~17% off
      SubscriptionBillingPeriod.promo => (monthly * 0.7).round(),
    };
    return qar * 100;
  }
}
