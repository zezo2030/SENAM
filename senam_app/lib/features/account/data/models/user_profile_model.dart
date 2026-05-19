import '../../domain/entities/user_profile.dart';

/// نموذج بيانات الملف الشخصي — يضيف تحويل JSON.
class UserProfileModel extends UserProfile {
  const UserProfileModel({
    required super.name,
    required super.phone,
    super.email,
  });

  factory UserProfileModel.fromJson(Map<String, dynamic> json) {
    return UserProfileModel(
      name: json['name'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      email: json['email'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'phone': phone,
        'email': email,
      };
}
