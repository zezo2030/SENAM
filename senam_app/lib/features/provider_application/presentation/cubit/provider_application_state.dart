import 'package:equatable/equatable.dart';
import '../../domain/entities/application_status.dart';
import '../../domain/entities/kyc_document.dart';

enum ApplicationFormStatus { idle, uploading, submitting, success, error }

/// أنواع الرفع المختلفة (لإظهار سبينر مناسب لكل عنصر).
enum UploadingSlot { none, logo, portfolio }

class ProviderApplicationState extends Equatable {
  // ── Catalog (loaded once for Step 1 + Step 2) ──────────────────────────
  final List<CatalogCategory> categories;
  final List<CatalogService> services;
  final bool catalogLoading;

  // ── Step 1: company info ───────────────────────────────────────────────
  final String legalName;
  final String displayName;
  final String slug;
  final String? logoObjectKey;
  final String? logoFileName;
  final String? categoryId;
  final bool hasCommercialRegistration;
  final String commercialRegistrationNo;
  final String description;
  final String phone;
  final String email;
  final String website;
  final String instagram;
  final String region;
  final String city;
  final bool consentAccepted;

  // ── Step 2: services ───────────────────────────────────────────────────
  final Set<String> selectedServiceIds;
  final String customServiceText;

  // ── Step 3: portfolio + extra contact ──────────────────────────────────
  final List<PortfolioPhoto> portfolioPhotos;
  final UploadingSlot uploadingSlot;
  final KycDocumentKind? uploadingKind;
  final String landline;
  final String whatsappLink;
  final String additionalNotes;

  // ── Step 4: subscription ───────────────────────────────────────────────
  final SubscriptionPlanTier? subscriptionPlan;
  final SubscriptionBillingPeriod subscriptionPeriod;

  // ── Owner login ────────────────────────────────────────────────────────
  final String ownerDisplayName;
  final String ownerPassword;

  // ── KYC documents ──────────────────────────────────────────────────────
  final Map<KycDocumentKind, KycDocument> documents;

  // ── Flow state ─────────────────────────────────────────────────────────
  final int currentStep;
  final ApplicationFormStatus status;
  final String? errorMessage;
  final CompanyApplicationResult? result;
  final CompanyApplicationStatus? lookup;

  const ProviderApplicationState({
    this.categories = const [],
    this.services = const [],
    this.catalogLoading = false,
    this.legalName = '',
    this.displayName = '',
    this.slug = '',
    this.logoObjectKey,
    this.logoFileName,
    this.categoryId,
    this.hasCommercialRegistration = true,
    this.commercialRegistrationNo = '',
    this.description = '',
    this.phone = '',
    this.email = '',
    this.website = '',
    this.instagram = '',
    this.region = '',
    this.city = '',
    this.consentAccepted = false,
    this.selectedServiceIds = const {},
    this.customServiceText = '',
    this.portfolioPhotos = const [],
    this.uploadingSlot = UploadingSlot.none,
    this.uploadingKind,
    this.landline = '',
    this.whatsappLink = '',
    this.additionalNotes = '',
    this.subscriptionPlan,
    this.subscriptionPeriod = SubscriptionBillingPeriod.monthly,
    this.ownerDisplayName = '',
    this.ownerPassword = '',
    this.documents = const {},
    this.currentStep = 0,
    this.status = ApplicationFormStatus.idle,
    this.errorMessage,
    this.result,
    this.lookup,
  });

  ProviderApplicationState copyWith({
    List<CatalogCategory>? categories,
    List<CatalogService>? services,
    bool? catalogLoading,
    String? legalName,
    String? displayName,
    String? slug,
    String? logoObjectKey,
    String? logoFileName,
    bool clearLogo = false,
    String? categoryId,
    bool? hasCommercialRegistration,
    String? commercialRegistrationNo,
    String? description,
    String? phone,
    String? email,
    String? website,
    String? instagram,
    String? region,
    String? city,
    bool? consentAccepted,
    Set<String>? selectedServiceIds,
    String? customServiceText,
    List<PortfolioPhoto>? portfolioPhotos,
    UploadingSlot? uploadingSlot,
    KycDocumentKind? uploadingKind,
    bool clearUploadingKind = false,
    String? landline,
    String? whatsappLink,
    String? additionalNotes,
    SubscriptionPlanTier? subscriptionPlan,
    bool clearSubscriptionPlan = false,
    SubscriptionBillingPeriod? subscriptionPeriod,
    String? ownerDisplayName,
    String? ownerPassword,
    Map<KycDocumentKind, KycDocument>? documents,
    int? currentStep,
    ApplicationFormStatus? status,
    String? errorMessage,
    bool clearError = false,
    CompanyApplicationResult? result,
    CompanyApplicationStatus? lookup,
  }) {
    return ProviderApplicationState(
      categories: categories ?? this.categories,
      services: services ?? this.services,
      catalogLoading: catalogLoading ?? this.catalogLoading,
      legalName: legalName ?? this.legalName,
      displayName: displayName ?? this.displayName,
      slug: slug ?? this.slug,
      logoObjectKey: clearLogo ? null : (logoObjectKey ?? this.logoObjectKey),
      logoFileName: clearLogo ? null : (logoFileName ?? this.logoFileName),
      categoryId: categoryId ?? this.categoryId,
      hasCommercialRegistration:
          hasCommercialRegistration ?? this.hasCommercialRegistration,
      commercialRegistrationNo:
          commercialRegistrationNo ?? this.commercialRegistrationNo,
      description: description ?? this.description,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      website: website ?? this.website,
      instagram: instagram ?? this.instagram,
      region: region ?? this.region,
      city: city ?? this.city,
      consentAccepted: consentAccepted ?? this.consentAccepted,
      selectedServiceIds: selectedServiceIds ?? this.selectedServiceIds,
      customServiceText: customServiceText ?? this.customServiceText,
      portfolioPhotos: portfolioPhotos ?? this.portfolioPhotos,
      uploadingSlot: uploadingSlot ?? this.uploadingSlot,
      uploadingKind:
          clearUploadingKind ? null : (uploadingKind ?? this.uploadingKind),
      landline: landline ?? this.landline,
      whatsappLink: whatsappLink ?? this.whatsappLink,
      additionalNotes: additionalNotes ?? this.additionalNotes,
      subscriptionPlan: clearSubscriptionPlan
          ? null
          : (subscriptionPlan ?? this.subscriptionPlan),
      subscriptionPeriod: subscriptionPeriod ?? this.subscriptionPeriod,
      ownerDisplayName: ownerDisplayName ?? this.ownerDisplayName,
      ownerPassword: ownerPassword ?? this.ownerPassword,
      documents: documents ?? this.documents,
      currentStep: currentStep ?? this.currentStep,
      status: status ?? this.status,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      result: result ?? this.result,
      lookup: lookup ?? this.lookup,
    );
  }

  @override
  List<Object?> get props => [
        categories,
        services,
        catalogLoading,
        legalName,
        displayName,
        slug,
        logoObjectKey,
        logoFileName,
        categoryId,
        hasCommercialRegistration,
        commercialRegistrationNo,
        description,
        phone,
        email,
        website,
        instagram,
        region,
        city,
        consentAccepted,
        selectedServiceIds,
        customServiceText,
        portfolioPhotos,
        uploadingSlot,
        uploadingKind,
        landline,
        whatsappLink,
        additionalNotes,
        subscriptionPlan,
        subscriptionPeriod,
        ownerDisplayName,
        ownerPassword,
        documents,
        currentStep,
        status,
        errorMessage,
        result,
        lookup,
      ];
}
