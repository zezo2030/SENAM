import 'package:flutter/material.dart';
import '../models/app_notification_model.dart';
import '../models/user_profile_model.dart';

/// مصدر بيانات الحساب — يُستبدل لاحقاً بمصدر بعيد.
abstract class AccountDataSource {
  Future<UserProfileModel> getProfile();
  Future<List<AppNotificationModel>> getNotifications();
}

class AccountLocalDataSource implements AccountDataSource {
  @override
  Future<UserProfileModel> getProfile() async {
    await Future.delayed(const Duration(milliseconds: 400));
    return const UserProfileModel(
      name: 'محمد علي',
      phone: '+974 55 123 456',
    );
  }

  @override
  Future<List<AppNotificationModel>> getNotifications() async {
    await Future.delayed(const Duration(milliseconds: 400));
    return const [
      AppNotificationModel(
        icon: Icons.local_shipping,
        title: 'الفني في الطريق إليك',
        body: 'فني قطر ووش سيصل خلال 15 دقيقة',
        time: 'الآن',
        isUnread: true,
      ),
      AppNotificationModel(
        icon: Icons.check_circle,
        title: 'تم تأكيد طلبك',
        body: 'تم تأكيد الطلب #SNM-2026-4587',
        time: 'قبل ساعة',
        isUnread: true,
      ),
      AppNotificationModel(
        icon: Icons.local_offer,
        title: 'عرض جديد متاح',
        body: 'خصم 30% على غسيل السيارات هذا الأسبوع',
        time: 'أمس',
        isUnread: false,
      ),
      AppNotificationModel(
        icon: Icons.star,
        title: 'قيّم تجربتك',
        body: 'شاركنا رأيك في خدمة لمسة فاخرة',
        time: 'قبل يومين',
        isUnread: false,
      ),
    ];
  }
}
