import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/banner.dart';

/// عقد مستودع البانرات — تُنفّذه طبقة الـ Data.
abstract class BannersRepository {
  Future<Either<Failure, List<Banner>>> getActiveBanners();
}
