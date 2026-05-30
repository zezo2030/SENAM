import 'package:flutter/material.dart';
import '../../domain/entities/company.dart';
import '../models/company_model.dart';
import '../models/review_model.dart';
import '../models/service_category_model.dart';
import '../models/sub_service_model.dart';

/// مصدر بيانات الخدمات (نسخة محلية وهمية).
abstract class ServicesDataSource {
  Future<List<ServiceCategoryModel>> getCategories();
  Future<List<SubServiceModel>> getSubServices(String categoryId);
  Future<List<CompanyModel>> getCompanies();
  Future<CompanyModel> getCompanyDetail(String companyId);
  Future<List<CompanyModel>> getCompaniesByCategory(String categoryId);
  Future<List<CompanyModel>> getCompaniesBySubService(String subServiceId);
  Future<List<ReviewModel>> getCompanyReviews(String companyId);
  Future<ReviewModel> submitCompanyReview({
    required String companyId,
    required int rating,
    String? comment,
  });
  Future<List<CompanyModel>> getFavoriteCompanies();
}

class ServicesLocalDataSource implements ServicesDataSource {
  static const Duration _latency = Duration(milliseconds: 250);

  /// التصنيفات الرئيسية الثمانية الظاهرة على الصفحة الرئيسية.
  static const List<ServiceCategoryModel> _categories = [
    ServiceCategoryModel(
        id: 'carwash', name: 'غسيل السيارات', icon: Icons.local_car_wash),
    ServiceCategoryModel(
        id: 'cleaning', name: 'تنظيف', icon: Icons.cleaning_services),
    ServiceCategoryModel(
        id: 'home_projects',
        name: 'مشاريع منزلية',
        icon: Icons.home_work_outlined),
    ServiceCategoryModel(
        id: 'maintenance',
        name: 'صيانة وإصلاح',
        icon: Icons.handyman_outlined),
    ServiceCategoryModel(
        id: 'moving', name: 'نقل وتخزين', icon: Icons.local_shipping),
    ServiceCategoryModel(
        id: 'gardens', name: 'حدائق خارجية', icon: Icons.local_florist),
    ServiceCategoryModel(
        id: 'construction',
        name: 'أعمال البناء',
        icon: Icons.construction),
    ServiceCategoryModel(
        id: 'pest', name: 'مكافحة حشرات', icon: Icons.bug_report_outlined),
  ];

  static const List<SubServiceModel> _subServices = [
    // مشاريع منزلية
    SubServiceModel(
      id: 'home_kitchen',
      categoryId: 'home_projects',
      name: 'مطابخ',
      description: 'تصميم وتركيب مطابخ عصرية بأعلى الخامات',
      icon: Icons.kitchen,
      thumbnail: 'assets/images/home/project_kitchen.png',
    ),
    SubServiceModel(
      id: 'home_paint',
      categoryId: 'home_projects',
      name: 'صبغ ودهانات',
      description: 'دهانات داخلية وخارجية بألوان حديثة',
      icon: Icons.format_paint,
      thumbnail: 'assets/images/home/project_paint.png',
    ),
    SubServiceModel(
      id: 'home_gypsum',
      categoryId: 'home_projects',
      name: 'جبس بورد',
      description: 'تركيب الجبس بورد بأشكال عصرية',
      icon: Icons.dashboard_outlined,
      thumbnail: 'assets/images/home/project_gypsum.png',
    ),
    SubServiceModel(
      id: 'home_decor',
      categoryId: 'home_projects',
      name: 'ديكور داخلي',
      description: 'تنفيذ تصاميم ديكور داخلية فاخرة',
      icon: Icons.chair_outlined,
      thumbnail: 'assets/images/home/project_finishing.png',
    ),
    SubServiceModel(
      id: 'home_flooring',
      categoryId: 'home_projects',
      name: 'أرضيات وبراكية',
      description: 'تركيب جميع أنواع الأرضيات والبراكية',
      icon: Icons.layers_outlined,
      thumbnail: 'assets/images/home/project_flooring.png',
    ),
    SubServiceModel(
      id: 'home_gardens',
      categoryId: 'home_projects',
      name: 'حدائق وتنسيق',
      description: 'تنسيق الحدائق والمساحات الخارجية',
      icon: Icons.park_outlined,
      thumbnail: 'assets/images/home/project_landscaping.png',
    ),
    SubServiceModel(
      id: 'home_pergola',
      categoryId: 'home_projects',
      name: 'مظلات وسواتر',
      description: 'تركيب المظلات والسواتر للحماية',
      icon: Icons.umbrella,
      thumbnail: 'assets/images/home/project_pergola.png',
    ),
    SubServiceModel(
      id: 'home_restore',
      categoryId: 'home_projects',
      name: 'ترميم وبناء',
      description: 'ترميم وبناء كامل بأعلى المعايير',
      icon: Icons.construction,
      thumbnail: 'assets/images/home/project_restoration.png',
    ),
    // التنظيف
    SubServiceModel(
      id: 'cleaning_homes',
      categoryId: 'cleaning',
      name: 'تنظيف المنازل',
      description: 'تنظيف شامل للمنازل والشقق',
      icon: Icons.home_outlined,
      thumbnail: 'assets/images/home/project_finishing.png',
    ),
    SubServiceModel(
      id: 'cleaning_sofa',
      categoryId: 'cleaning',
      name: 'تنظيف الكنب والمجالس',
      description: 'إزالة البقع وتعقيم الكنب',
      icon: Icons.weekend_outlined,
      thumbnail: 'assets/images/home/project_finishing.png',
    ),
    SubServiceModel(
      id: 'cleaning_carpet',
      categoryId: 'cleaning',
      name: 'تنظيف السجاد',
      description: 'غسيل السجاد بالمنزل أو في المغسلة',
      icon: Icons.grid_on,
      thumbnail: 'assets/images/home/project_flooring.png',
    ),
    SubServiceModel(
      id: 'cleaning_tanks',
      categoryId: 'cleaning',
      name: 'تنظيف الخزانات',
      description: 'تنظيف وتعقيم الخزانات',
      icon: Icons.water_drop_outlined,
      thumbnail: 'assets/images/home/project_gypsum.png',
    ),
    SubServiceModel(
      id: 'cleaning_post_build',
      categoryId: 'cleaning',
      name: 'تنظيف بعد البناء',
      description: 'تنظيف شامل بعد التشطيب',
      icon: Icons.cleaning_services_outlined,
      thumbnail: 'assets/images/home/project_restoration.png',
    ),
    // غسيل السيارات
    SubServiceModel(
      id: 'carwash_outside',
      categoryId: 'carwash',
      name: 'غسيل خارجي',
      description: 'غسيل خارجي احترافي يصل إليك',
      icon: Icons.directions_car,
      thumbnail: 'assets/images/home/promo_car_premium.png',
    ),
    SubServiceModel(
      id: 'carwash_inside',
      categoryId: 'carwash',
      name: 'غسيل داخلي',
      description: 'تنظيف داخلي شامل',
      icon: Icons.airline_seat_recline_normal,
      thumbnail: 'assets/images/home/promo_wash_premium.png',
    ),
    SubServiceModel(
      id: 'carwash_polish',
      categoryId: 'carwash',
      name: 'تلميع وتشميع',
      description: 'تلميع وحماية الطلاء',
      icon: Icons.auto_fix_high,
      thumbnail: 'assets/images/home/promo_car_premium.png',
    ),
    SubServiceModel(
      id: 'carwash_ceramic',
      categoryId: 'carwash',
      name: 'نانو سيراميك',
      description: 'حماية فائقة للطلاء',
      icon: Icons.shield_outlined,
      thumbnail: 'assets/images/home/promo_wash_premium.png',
    ),
    // صيانة وإصلاح
    SubServiceModel(
      id: 'maint_electric',
      categoryId: 'maintenance',
      name: 'كهرباء',
      description: 'صيانة وإصلاح كهربائي',
      icon: Icons.electrical_services,
      thumbnail: 'assets/images/home/project_finishing.png',
    ),
    SubServiceModel(
      id: 'maint_plumber',
      categoryId: 'maintenance',
      name: 'سباكة',
      description: 'إصلاح وصيانة السباكة',
      icon: Icons.plumbing,
      thumbnail: 'assets/images/home/project_gypsum.png',
    ),
    SubServiceModel(
      id: 'maint_ac',
      categoryId: 'maintenance',
      name: 'تكييف',
      description: 'صيانة وتركيب المكيفات',
      icon: Icons.ac_unit,
      thumbnail: 'assets/images/home/project_finishing.png',
    ),
    // نقل وتخزين
    SubServiceModel(
      id: 'moving_furniture',
      categoryId: 'moving',
      name: 'نقل أثاث',
      description: 'فك وتركيب ونقل الأثاث',
      icon: Icons.local_shipping_outlined,
      thumbnail: 'assets/images/home/project_restoration.png',
    ),
    SubServiceModel(
      id: 'moving_storage',
      categoryId: 'moving',
      name: 'تخزين مؤقت',
      description: 'مستودعات مؤمّنة',
      icon: Icons.warehouse_outlined,
      thumbnail: 'assets/images/home/project_gypsum.png',
    ),
    SubServiceModel(
      id: 'moving_lift',
      categoryId: 'moving',
      name: 'ونش رفع',
      description: 'خدمة ونش رفع للأدوار العالية',
      icon: Icons.upgrade,
      thumbnail: 'assets/images/home/project_restoration.png',
    ),
    // حدائق خارجية
    SubServiceModel(
      id: 'gardens_landscape',
      categoryId: 'gardens',
      name: 'تنسيق حدائق',
      description: 'تصميم وتنسيق الحدائق',
      icon: Icons.park,
      thumbnail: 'assets/images/home/project_landscaping.png',
    ),
    SubServiceModel(
      id: 'gardens_irrigation',
      categoryId: 'gardens',
      name: 'أنظمة ري',
      description: 'تركيب وصيانة أنظمة الري',
      icon: Icons.water,
      thumbnail: 'assets/images/home/project_landscaping.png',
    ),
    // أعمال البناء
    SubServiceModel(
      id: 'build_finishing',
      categoryId: 'construction',
      name: 'تشطيبات',
      description: 'أعمال تشطيب متكاملة',
      icon: Icons.format_paint,
      thumbnail: 'assets/images/home/project_finishing.png',
    ),
    SubServiceModel(
      id: 'build_demolish',
      categoryId: 'construction',
      name: 'هدم',
      description: 'هدم آمن للجدران',
      icon: Icons.foundation,
      thumbnail: 'assets/images/home/project_restoration.png',
    ),
    // مكافحة حشرات
    SubServiceModel(
      id: 'pest_general',
      categoryId: 'pest',
      name: 'مكافحة عامة',
      description: 'مكافحة الحشرات والقوارض',
      icon: Icons.bug_report_outlined,
      thumbnail: 'assets/images/home/project_landscaping.png',
    ),
  ];

  static const _trustedFeatures = <CompanyFeature>[
    CompanyFeature(ar: 'أسعار تنافسية', en: 'Competitive pricing', icon: 'pricing'),
    CompanyFeature(ar: 'ضمان على العمل', en: 'Warranty', icon: 'warranty'),
    CompanyFeature(ar: 'تنفيذ احترافي', en: 'Professional execution', icon: 'craftsmanship'),
    CompanyFeature(ar: 'مواد عالية الجودة', en: 'High quality', icon: 'quality'),
    CompanyFeature(ar: 'تصاميم مخصصة', en: 'Custom design', icon: 'design'),
  ];

  static const _photoSeeds = [
    'https://picsum.photos/seed/kitchen1/600/600',
    'https://picsum.photos/seed/kitchen2/600/600',
    'https://picsum.photos/seed/kitchen3/600/600',
    'https://picsum.photos/seed/kitchen4/600/600',
    'https://picsum.photos/seed/kitchen5/600/600',
    'https://picsum.photos/seed/kitchen6/600/600',
    'https://picsum.photos/seed/kitchen7/600/600',
    'https://picsum.photos/seed/kitchen8/600/600',
    'https://picsum.photos/seed/kitchen9/600/600',
  ];

  static const Map<int, int> _defaultBreakdown = {
    5: 45,
    4: 12,
    3: 4,
    2: 2,
    1: 1,
  };

  static final List<CompanyModel> _companies = [
    // مطابخ
    CompanyModel(
      id: 'c_luxe_kitchens',
      name: 'لوكس للمطابخ',
      categoryId: 'home_projects',
      logoLabel: 'LK',
      logoColor: const Color(0xFFC9A24B),
      rating: 4.9,
      reviewsCount: 64,
      startPrice: 0,
      distanceKm: 2.5,
      durationRange: '',
      description: 'تصاميم عصرية - جودة عالية',
      address: 'الدوحة، اللؤلؤة',
      workingHours: 'يومياً 8:00 ص - 9:00 م',
      services: const [],
      subServiceIds: const ['home_kitchen'],
      experienceYears: 'خبرة 7 سنوات',
      phone: '+97444445555',
      whatsapp: '+97444445555',
      instagram: '@luxe.kitchens',
      city: 'الدوحة',
      workPhotos: _photoSeeds,
      features: _trustedFeatures,
      ratingBreakdown: _defaultBreakdown,
    ),
    CompanyModel(
      id: 'c_modern_house',
      name: 'مودرن هاوس',
      categoryId: 'home_projects',
      logoLabel: 'MH',
      logoColor: const Color(0xFF26A69A),
      rating: 4.8,
      reviewsCount: 96,
      startPrice: 0,
      distanceKm: 3.0,
      durationRange: '',
      description: 'تصاميم حديثة - أسعار مناسبة',
      address: 'الدوحة، الوكرة',
      workingHours: 'يومياً 8:00 ص - 10:00 م',
      services: const [],
      subServiceIds: const ['home_kitchen', 'home_decor'],
      experienceYears: 'خبرة 6 سنوات',
      phone: '+97444446666',
      whatsapp: '+97444446666',
      instagram: '@modern.house',
      city: 'الدوحة',
      workPhotos: _photoSeeds,
      features: _trustedFeatures,
      ratingBreakdown: _defaultBreakdown,
    ),
    CompanyModel(
      id: 'c_kitchen_art',
      name: 'كيتشن آرت',
      categoryId: 'home_projects',
      logoLabel: 'KA',
      logoColor: const Color(0xFF7E57C2),
      rating: 4.7,
      reviewsCount: 74,
      startPrice: 0,
      distanceKm: 4.0,
      durationRange: '',
      description: 'تفاصيل دقيقة - تنفيذ احترافي',
      address: 'الريان',
      workingHours: 'يومياً 9:00 ص - 9:00 م',
      services: const [],
      subServiceIds: const ['home_kitchen'],
      experienceYears: 'خبرة 5 سنوات',
      phone: '+97444447777',
      whatsapp: '+97444447777',
      instagram: '@kitchen.art',
      city: 'الريان',
      workPhotos: _photoSeeds,
      features: _trustedFeatures,
      ratingBreakdown: _defaultBreakdown,
    ),
    CompanyModel(
      id: 'c_q_kitchens',
      name: 'كيو للمطابخ',
      categoryId: 'home_projects',
      logoLabel: 'Q',
      logoColor: const Color(0xFFEF5350),
      rating: 4.7,
      reviewsCount: 61,
      startPrice: 0,
      distanceKm: 5.0,
      durationRange: '',
      description: 'جودة وفن في كل تفصيلة',
      address: 'الدوحة، السد',
      workingHours: 'يومياً 9:00 ص - 9:00 م',
      services: const [],
      subServiceIds: const ['home_kitchen'],
      experienceYears: 'خبرة 4 سنوات',
      phone: '+97444448888',
      whatsapp: '+97444448888',
      instagram: '@q.kitchens',
      city: 'الدوحة',
      workPhotos: _photoSeeds,
      features: _trustedFeatures,
      ratingBreakdown: _defaultBreakdown,
    ),
    // شركات مميزة على الصفحة الرئيسية (متعددة الأقسام)
    CompanyModel(
      id: 'c_crystal_wash',
      name: 'كريستال ووش',
      categoryId: 'carwash',
      logoLabel: 'CW',
      logoColor: const Color(0xFF1E88E5),
      rating: 4.8,
      reviewsCount: 320,
      startPrice: 0,
      distanceKm: 1.2,
      durationRange: '',
      description: 'غسيل سيارات',
      address: 'الدوحة',
      workingHours: 'يومياً 8:00 ص - 11:00 م',
      services: const [],
      subServiceIds: const ['carwash_outside', 'carwash_polish'],
      experienceYears: 'خبرة 5 سنوات',
      phone: '+97444441111',
      whatsapp: '+97444441111',
      instagram: '@crystal.wash',
      city: 'الدوحة',
      workPhotos: _photoSeeds,
      features: _trustedFeatures,
      ratingBreakdown: _defaultBreakdown,
    ),
    CompanyModel(
      id: 'c_clean_home',
      name: 'كلين هوم',
      categoryId: 'cleaning',
      logoLabel: 'CH',
      logoColor: const Color(0xFF26A69A),
      rating: 4.9,
      reviewsCount: 512,
      startPrice: 0,
      distanceKm: 2.0,
      durationRange: '',
      description: 'تنظيف منازل',
      address: 'الدوحة',
      workingHours: 'يومياً 8:00 ص - 8:00 م',
      services: const [],
      subServiceIds: const ['cleaning_homes', 'cleaning_sofa'],
      experienceYears: 'خبرة 7 سنوات',
      phone: '+97444442222',
      whatsapp: '+97444442222',
      instagram: '@clean.home',
      city: 'الدوحة',
      workPhotos: _photoSeeds,
      features: _trustedFeatures,
      ratingBreakdown: _defaultBreakdown,
    ),
    CompanyModel(
      id: 'c_color_pro',
      name: 'كلر برو',
      categoryId: 'home_projects',
      logoLabel: 'CP',
      logoColor: const Color(0xFFE0A93C),
      rating: 4.7,
      reviewsCount: 180,
      startPrice: 0,
      distanceKm: 3.5,
      durationRange: '',
      description: 'صبغ ودهانات',
      address: 'الدوحة',
      workingHours: 'يومياً 8:00 ص - 10:00 م',
      services: const [],
      subServiceIds: const ['home_paint'],
      experienceYears: 'خبرة 6 سنوات',
      phone: '+97444443333',
      whatsapp: '+97444443333',
      instagram: '@color.pro',
      city: 'الدوحة',
      workPhotos: _photoSeeds,
      features: _trustedFeatures,
      ratingBreakdown: _defaultBreakdown,
    ),
  ];

  static const List<ReviewModel> _reviews = [
    ReviewModel(
        authorName: 'أحمد المري',
        stars: 5,
        comment:
            'خدمة ممتازة جداً، فريق محترف وملتزم بالمواعيد. أنصح بالتعامل معهم.'),
    ReviewModel(
        authorName: 'سارة الكواري',
        stars: 5,
        comment:
            'تعامل راقي وتنفيذ رائع. الجودة فوق توقعاتي.'),
    ReviewModel(
        authorName: 'محمد العلي',
        stars: 4,
        comment:
            'سعر مناسب مقابل جودة عالية، تابعوا التفاصيل وما قصروا.'),
    ReviewModel(
        authorName: 'فهد جاسم',
        stars: 5,
        comment: 'الفريق احترافي والتعامل ممتاز.'),
  ];

  @override
  Future<List<ServiceCategoryModel>> getCategories() async {
    await Future.delayed(_latency);
    return _categories;
  }

  @override
  Future<List<SubServiceModel>> getSubServices(String categoryId) async {
    await Future.delayed(_latency);
    return _subServices.where((s) => s.categoryId == categoryId).toList();
  }

  @override
  Future<List<CompanyModel>> getCompanies() async {
    await Future.delayed(_latency);
    return _companies;
  }

  @override
  Future<CompanyModel> getCompanyDetail(String companyId) async {
    await Future.delayed(_latency);
    return _companies.firstWhere((c) => c.id == companyId);
  }

  @override
  Future<List<CompanyModel>> getCompaniesByCategory(
      String categoryId) async {
    await Future.delayed(_latency);
    final list =
        _companies.where((c) => c.categoryId == categoryId).toList();
    return list.isEmpty ? _companies : list;
  }

  @override
  Future<List<CompanyModel>> getCompaniesBySubService(
      String subServiceId) async {
    await Future.delayed(_latency);
    final exact = _companies
        .where((c) => c.subServiceIds.contains(subServiceId))
        .toList();
    if (exact.isNotEmpty) return exact;
    final sub = _subServices.firstWhere(
      (s) => s.id == subServiceId,
      orElse: () => _subServices.first,
    );
    return _companies.where((c) => c.categoryId == sub.categoryId).toList();
  }

  @override
  Future<List<ReviewModel>> getCompanyReviews(String companyId) async {
    await Future.delayed(_latency);
    return _reviews;
  }

  @override
  Future<ReviewModel> submitCompanyReview({
    required String companyId,
    required int rating,
    String? comment,
  }) async {
    await Future.delayed(_latency);
    return ReviewModel(
      authorName: 'مستخدم SENAM',
      stars: rating,
      comment: comment ?? '',
    );
  }

  @override
  Future<List<CompanyModel>> getFavoriteCompanies() async {
    await Future.delayed(_latency);
    return _companies.skip(4).take(3).toList();
  }
}
