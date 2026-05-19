import '../../../../core/error/exceptions.dart';
import '../models/user_model.dart';

/// مصدر بيانات المصادقة (نسخة محلية وهمية).
///
/// تُستبدل لاحقاً بـ `AuthRemoteDataSource` يتصل بالـ API.
abstract class AuthDataSource {
  Future<UserModel> login({required String email, required String password});
}

class AuthLocalDataSource implements AuthDataSource {
  static const _mockAccounts = {
    'demo@senam.qa': _MockAccount(
      id: 'u1',
      name: 'محمد علي',
      password: '123456',
      phone: '+974 55 123 456',
    ),
    'apple@senam.qa': _MockAccount(
      id: 'u2',
      name: 'مستخدم Apple',
      password: '123456',
    ),
    'google@senam.qa': _MockAccount(
      id: 'u3',
      name: 'مستخدم Google',
      password: '123456',
    ),
  };

  @override
  Future<UserModel> login({
    required String email,
    required String password,
  }) async {
    await Future.delayed(const Duration(milliseconds: 700));

    final account = _mockAccounts[email.trim().toLowerCase()];
    if (account == null || account.password != password) {
      throw const ServerException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    return UserModel(
      id: account.id,
      name: account.name,
      email: email.trim().toLowerCase(),
      phone: account.phone,
    );
  }
}

class _MockAccount {
  final String id;
  final String name;
  final String password;
  final String? phone;

  const _MockAccount({
    required this.id,
    required this.name,
    required this.password,
    this.phone,
  });
}
