import 'package:flutter/material.dart';
import '../models/company_model.dart';
import '../models/review_model.dart';
import '../models/service_category_model.dart';

/// مصدر بيانات الخدمات (نسخة محلية وهمية).
///
/// تُستبدل لاحقاً بـ `ServicesRemoteDataSource` يتصل بالـ API.
abstract class ServicesDataSource {
  Future<List<ServiceCategoryModel>> getCategories();
  Future<List<CompanyModel>> getCompanies();
  Future<List<CompanyModel>> getCompaniesByCategory(String categoryId);
  Future<List<ReviewModel>> getCompanyReviews(String companyId);
  Future<List<CompanyModel>> getFavoriteCompanies();
}

class ServicesLocalDataSource implements ServicesDataSource {
  static const Duration _latency = Duration(milliseconds: 400);

  static const List<ServiceCategoryModel> _categories = [
    ServiceCategoryModel(
        id: 'carwash', name: 'غسيل سيارات', icon: Icons.local_car_wash),
    ServiceCategoryModel(
        id: 'barber', name: 'حلاقة', icon: Icons.content_cut),
    ServiceCategoryModel(
        id: 'cleaning', name: 'تنظيف', icon: Icons.cleaning_services),
    ServiceCategoryModel(
        id: 'maintenance', name: 'صيانة', icon: Icons.build),
    ServiceCategoryModel(
        id: 'electric', name: 'كهربائي', icon: Icons.bolt),
    ServiceCategoryModel(
        id: 'plumber', name: 'سباك', icon: Icons.plumbing),
  ];

  static const List<CompanyModel> _companies = [
    CompanyModel(
      id: 'c1',
      name: 'قطر ووش',
      categoryId: 'carwash',
      logoLabel: 'QW',
      logoColor: Color(0xFF1E88E5),
      rating: 4.8,
      reviewsCount: 320,
      startPrice: 55,
      distanceKm: 1.2,
      durationRange: '20-30 دقيقة',
      description:
          'نقدم خدمة غسيل السيارات المتنقل بأفضل المنتجات وأحدث المعدات. نصل إليك في مكانك في أي مكان في الدوحة.',
      address: 'الدوحة، اللؤلؤة، برج 25، شقة 12',
      workingHours: 'يومياً 8:00 ص - 11:00 م',
      services: [
        CompanyServiceModel(
            name: 'غسيل خارجي', price: 55, duration: '20 دقيقة'),
        CompanyServiceModel(
            name: 'غسيل داخلي', price: 80, duration: '30 دقيقة'),
        CompanyServiceModel(
            name: 'غسيل شامل', price: 120, duration: '45 دقيقة'),
        CompanyServiceModel(name: 'تلميع', price: 100, duration: '40 دقيقة'),
        CompanyServiceModel(name: 'تشميع', price: 70, duration: '30 دقيقة'),
      ],
    ),
    CompanyModel(
      id: 'c2',
      name: 'لمسة فاخرة',
      categoryId: 'carwash',
      logoLabel: 'LF',
      logoColor: Color(0xFF8E24AA),
      rating: 4.6,
      reviewsCount: 210,
      startPrice: 70,
      distanceKm: 1.5,
      durationRange: '30-40 دقيقة',
      description:
          'خدمة فاخرة لغسيل وتلميع السيارات الفخمة. عناية احترافية تليق بسيارتك.',
      address: 'الدوحة، الوكرة، شارع 12',
      workingHours: 'يومياً 9:00 ص - 10:00 م',
      services: [
        CompanyServiceModel(
            name: 'غسيل خارجي', price: 70, duration: '25 دقيقة'),
        CompanyServiceModel(
            name: 'غسيل شامل', price: 130, duration: '50 دقيقة'),
        CompanyServiceModel(
            name: 'تلميع فاخر', price: 150, duration: '60 دقيقة'),
      ],
    ),
    CompanyModel(
      id: 'c3',
      name: 'بريق للغسيل المتنقل',
      categoryId: 'carwash',
      logoLabel: 'BR',
      logoColor: Color(0xFFC9A24B),
      rating: 4.7,
      reviewsCount: 180,
      startPrice: 60,
      distanceKm: 1.8,
      durationRange: '20-30 دقيقة',
      description:
          'نقدم خدمة غسيل السيارات المتنقل بأفضل المنتجات وأحدث المعدات. نصل إليك في مكانك في أي مكان في الدوحة.',
      address: 'الدوحة، اللؤلؤة، برج 25، شقة 12',
      workingHours: 'يومياً 8:00 ص - 11:00 م',
      services: [
        CompanyServiceModel(
            name: 'غسيل خارجي', price: 60, duration: '20 دقيقة'),
        CompanyServiceModel(
            name: 'غسيل داخلي', price: 80, duration: '30 دقيقة'),
        CompanyServiceModel(
            name: 'غسيل شامل', price: 120, duration: '45 دقيقة'),
      ],
    ),
    CompanyModel(
      id: 'c4',
      name: 'سباركل كار',
      categoryId: 'carwash',
      logoLabel: 'SP',
      logoColor: Color(0xFFE0A93C),
      rating: 4.5,
      reviewsCount: 98,
      startPrice: 65,
      distanceKm: 2.1,
      durationRange: '30-40 دقيقة',
      description: 'لمعان يدوم طويلاً. خدمة غسيل احترافية بأسعار تنافسية.',
      address: 'الدوحة، الخليج الغربي',
      workingHours: 'يومياً 7:00 ص - 11:00 م',
      services: [
        CompanyServiceModel(
            name: 'غسيل خارجي', price: 65, duration: '25 دقيقة'),
        CompanyServiceModel(
            name: 'غسيل شامل', price: 110, duration: '45 دقيقة'),
      ],
    ),
    CompanyModel(
      id: 'c5',
      name: 'كلين برو',
      categoryId: 'cleaning',
      logoLabel: 'CP',
      logoColor: Color(0xFF26A69A),
      rating: 4.8,
      reviewsCount: 512,
      startPrice: 50,
      distanceKm: 2.5,
      durationRange: '60-90 دقيقة',
      description: 'خدمات تنظيف منزلي شاملة بفريق مدرب ومعدات حديثة.',
      address: 'الدوحة، معيذر',
      workingHours: 'يومياً 8:00 ص - 8:00 م',
      services: [
        CompanyServiceModel(
            name: 'تنظيف شقة', price: 150, duration: '90 دقيقة'),
        CompanyServiceModel(
            name: 'تنظيف فيلا', price: 300, duration: '180 دقيقة'),
      ],
    ),
    CompanyModel(
      id: 'c6',
      name: 'فكس ماستر',
      categoryId: 'electric',
      logoLabel: 'FM',
      logoColor: Color(0xFFEF5350),
      rating: 4.9,
      reviewsCount: 218,
      startPrice: 80,
      distanceKm: 3.0,
      durationRange: '60 دقيقة',
      description: 'حلول كهربائية احترافية للمنازل والمكاتب.',
      address: 'الدوحة، السد',
      workingHours: 'يومياً 24 ساعة',
      services: [
        CompanyServiceModel(
            name: 'صيانة كهرباء', price: 80, duration: '60 دقيقة'),
        CompanyServiceModel(
            name: 'تركيب إنارة', price: 120, duration: '90 دقيقة'),
      ],
    ),
  ];

  static const List<ReviewModel> _reviews = [
    ReviewModel(
        authorName: 'أحمد علي',
        stars: 5,
        comment: 'خدمة ممتازة وسريعة، السيارة رجعت كالجديدة!'),
    ReviewModel(
        authorName: 'فهد المري',
        stars: 4,
        comment: 'الفني محترف جداً والتعامل راقي.'),
    ReviewModel(
        authorName: 'سارة خالد',
        stars: 5,
        comment: 'أنصح فيهم، التزام بالوقت ونظافة عالية.'),
  ];

  @override
  Future<List<ServiceCategoryModel>> getCategories() async {
    await Future.delayed(_latency);
    return _categories;
  }

  @override
  Future<List<CompanyModel>> getCompanies() async {
    await Future.delayed(_latency);
    return _companies;
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
  Future<List<ReviewModel>> getCompanyReviews(String companyId) async {
    await Future.delayed(_latency);
    return _reviews;
  }

  @override
  Future<List<CompanyModel>> getFavoriteCompanies() async {
    await Future.delayed(_latency);
    return _companies.take(3).toList();
  }
}
