import 'package:equatable/equatable.dart';

/// كيان الملف الشخصي للمستخدم في طبقة الـ Domain.
class UserProfile extends Equatable {
  final String name, phone;
  final String? email;

  const UserProfile({
    required this.name,
    required this.phone,
    this.email,
  });

  @override
  List<Object?> get props => [name, phone, email];
}
