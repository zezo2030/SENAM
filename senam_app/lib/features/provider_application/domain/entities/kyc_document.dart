import 'package:equatable/equatable.dart';

/// نوع وثيقة الـ KYC (يطابق المسموح به في الـ backend).
enum KycDocumentKind {
  commercialRegistration,
  taxCard,
  ownerId,
  premisesPhoto,
  certification,
  insurance,
}

extension KycDocumentKindX on KycDocumentKind {
  String get apiValue {
    switch (this) {
      case KycDocumentKind.commercialRegistration:
        return 'commercial_registration';
      case KycDocumentKind.taxCard:
        return 'tax_card';
      case KycDocumentKind.ownerId:
        return 'owner_id';
      case KycDocumentKind.premisesPhoto:
        return 'premises_photo';
      case KycDocumentKind.certification:
        return 'certification';
      case KycDocumentKind.insurance:
        return 'insurance';
    }
  }

  String get labelAr {
    switch (this) {
      case KycDocumentKind.commercialRegistration:
        return 'السجل التجاري';
      case KycDocumentKind.taxCard:
        return 'البطاقة الضريبية';
      case KycDocumentKind.ownerId:
        return 'هوية المالك';
      case KycDocumentKind.premisesPhoto:
        return 'صور المقر';
      case KycDocumentKind.certification:
        return 'شهادات (اختياري)';
      case KycDocumentKind.insurance:
        return 'تأمين (اختياري)';
    }
  }

  bool get isRequired =>
      this == KycDocumentKind.commercialRegistration ||
      this == KycDocumentKind.ownerId;
}

/// وثيقة KYC مرفوعة على الـ object storage جاهزة للإرسال.
class KycDocument extends Equatable {
  final KycDocumentKind kind;
  final String objectKey;
  final String fileName;

  const KycDocument({
    required this.kind,
    required this.objectKey,
    required this.fileName,
  });

  @override
  List<Object?> get props => [kind, objectKey, fileName];
}

/// صورة معرض الأعمال السابقة (Step 3).
class PortfolioPhoto extends Equatable {
  final String objectKey;
  final String fileName;
  final int sortOrder;

  const PortfolioPhoto({
    required this.objectKey,
    required this.fileName,
    required this.sortOrder,
  });

  @override
  List<Object?> get props => [objectKey, fileName, sortOrder];
}

/// خدمة من الكاتالوج يمكن للشركة عرضها (Step 2).
class CatalogService extends Equatable {
  final String id;
  final String slug;
  final String nameAr;
  final String? nameEn;
  final String categoryId;

  const CatalogService({
    required this.id,
    required this.slug,
    required this.nameAr,
    required this.categoryId,
    this.nameEn,
  });

  @override
  List<Object?> get props => [id, slug, nameAr, nameEn, categoryId];
}

/// فئة رئيسية لاختيار نوع الخدمة في Step 1.
class CatalogCategory extends Equatable {
  final String id;
  final String slug;
  final String nameAr;
  final String? nameEn;

  const CatalogCategory({
    required this.id,
    required this.slug,
    required this.nameAr,
    this.nameEn,
  });

  @override
  List<Object?> get props => [id, slug, nameAr, nameEn];
}

/// نوع الباقة المختار (Step 4).
enum SubscriptionPlanTier { basic, pro, vip }

extension SubscriptionPlanTierX on SubscriptionPlanTier {
  String get apiValue {
    switch (this) {
      case SubscriptionPlanTier.basic:
        return 'basic';
      case SubscriptionPlanTier.pro:
        return 'pro';
      case SubscriptionPlanTier.vip:
        return 'vip';
    }
  }

  String get labelAr {
    switch (this) {
      case SubscriptionPlanTier.basic:
        return 'Basic';
      case SubscriptionPlanTier.pro:
        return 'Pro';
      case SubscriptionPlanTier.vip:
        return 'VIP';
    }
  }
}

/// دورة الفوترة (Step 4).
enum SubscriptionBillingPeriod { monthly, annual, promo }

extension SubscriptionBillingPeriodX on SubscriptionBillingPeriod {
  String get apiValue {
    switch (this) {
      case SubscriptionBillingPeriod.monthly:
        return 'monthly';
      case SubscriptionBillingPeriod.annual:
        return 'annual';
      case SubscriptionBillingPeriod.promo:
        return 'promo';
    }
  }

  String get labelAr {
    switch (this) {
      case SubscriptionBillingPeriod.monthly:
        return 'شهري';
      case SubscriptionBillingPeriod.annual:
        return 'سنوي';
      case SubscriptionBillingPeriod.promo:
        return 'الأشهر';
    }
  }
}

/// طلب تقديم شركة جديد — يجمع كل الحقول من خطوات الـ wizard الأربع.
class CompanyApplicationDraft extends Equatable {
  // Step 1
  final String legalName;
  final String displayName;
  final String slug;
  final String? logoObjectKey;
  final String? categoryId;
  final bool hasCommercialRegistration;
  final String? commercialRegistrationNo;
  final String? description;
  final String? phone;
  final String? email;
  final String? website;
  final String? instagram;
  final String? region;
  final String? city;

  // Step 2
  final List<String> serviceIds;
  final String? customServiceText;

  // Step 3
  final List<PortfolioPhoto> portfolioPhotos;
  final String? landline;
  final String? whatsappLink;
  final String? additionalNotes;

  // Step 4
  final SubscriptionPlanTier? subscriptionPlan;
  final SubscriptionBillingPeriod? subscriptionPeriod;
  final int? subscriptionPrice;

  // Owner login
  final String ownerEmail;
  final String? ownerDisplayName;
  final String ownerPassword;

  // KYC
  final List<KycDocument> documents;

  const CompanyApplicationDraft({
    required this.legalName,
    required this.displayName,
    required this.slug,
    this.logoObjectKey,
    this.categoryId,
    this.hasCommercialRegistration = true,
    this.commercialRegistrationNo,
    this.description,
    this.phone,
    this.email,
    this.website,
    this.instagram,
    this.region,
    this.city,
    this.serviceIds = const [],
    this.customServiceText,
    this.portfolioPhotos = const [],
    this.landline,
    this.whatsappLink,
    this.additionalNotes,
    this.subscriptionPlan,
    this.subscriptionPeriod,
    this.subscriptionPrice,
    required this.ownerEmail,
    this.ownerDisplayName,
    required this.ownerPassword,
    required this.documents,
  });

  @override
  List<Object?> get props => [
        legalName,
        displayName,
        slug,
        logoObjectKey,
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
        serviceIds,
        customServiceText,
        portfolioPhotos,
        landline,
        whatsappLink,
        additionalNotes,
        subscriptionPlan,
        subscriptionPeriod,
        subscriptionPrice,
        ownerEmail,
        ownerDisplayName,
        ownerPassword,
        documents,
      ];
}
