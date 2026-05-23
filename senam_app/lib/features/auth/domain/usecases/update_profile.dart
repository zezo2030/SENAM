import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/user.dart';
import '../repositories/auth_repository.dart';

/// Use Case: تحديث الملف الشخصي.
class UpdateProfile implements UseCase<User, UpdateProfileParams> {
  final AuthRepository repository;
  const UpdateProfile(this.repository);

  @override
  Future<Either<Failure, User>> call(UpdateProfileParams params) {
    return repository.updateProfile(
      displayName: params.displayName,
      phone: params.phone,
      locale: params.locale,
    );
  }
}

class UpdateProfileParams extends Equatable {
  final String? displayName;
  final String? phone;
  final String? locale;

  const UpdateProfileParams({this.displayName, this.phone, this.locale});

  @override
  List<Object?> get props => [displayName, phone, locale];
}
