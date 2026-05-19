import 'package:equatable/equatable.dart';

/// كيان المستخدم في طبقة الـ Domain.
class User extends Equatable {
  final String id;
  final String name;
  final String email;
  final String? phone;

  const User({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
  });

  @override
  List<Object?> get props => [id, name, email, phone];
}
