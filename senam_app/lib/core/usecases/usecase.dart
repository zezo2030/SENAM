import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import '../error/failures.dart';

/// العقد الأساسي لأي Use Case في طبقة الـ Domain.
///
/// [Type] هو نوع القيمة الناتجة عند النجاح.
/// [Params] هو نوع المعاملات الممرّرة للـ Use Case.
abstract class UseCase<Type, Params> {
  Future<Either<Failure, Type>> call(Params params);
}

/// نسخة متزامنة من الـ Use Case (بدون Future) — للعمليات المحلية الفورية.
abstract class SyncUseCase<Type, Params> {
  Either<Failure, Type> call(Params params);
}

/// تُستخدم عندما لا يحتاج الـ Use Case إلى أي معاملات.
class NoParams extends Equatable {
  const NoParams();

  @override
  List<Object?> get props => [];
}
