import '../../domain/entities/user.dart';

/// نموذج بيانات المستخدم في طبقة الـ Data.
/// يضيف تحويل JSON فوق الكيان — جاهز لربط الـ Backend.
class UserModel extends User {
  const UserModel({
    required super.id,
    required super.name,
    required super.email,
    super.phone,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      phone: json['phone'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'phone': phone,
      };
}
