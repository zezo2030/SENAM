import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/sub_service.dart';
import '../../domain/usecases/get_companies.dart';
import '../../domain/usecases/get_sub_services.dart';

part 'sub_services_state.dart';

/// Cubit لقائمة الخدمات الفرعية ضمن تصنيف معيّن، مع حساب عدد الشركات لكل خدمة.
class SubServicesCubit extends Cubit<SubServicesState> {
  final GetSubServices getSubServices;
  final GetCompanies getCompanies;

  SubServicesCubit({
    required this.getSubServices,
    required this.getCompanies,
  }) : super(const SubServicesState());

  Future<void> load(String categoryId) async {
    emit(state.copyWith(status: SubServicesStatus.loading));
    final subResult = await getSubServices(categoryId);
    final companiesResult = await getCompanies(const NoParams());

    subResult.fold(
      (failure) => emit(state.copyWith(
        status: SubServicesStatus.failure,
        errorMessage: failure.message,
      )),
      (items) {
        final counts = <String, int>{};
        companiesResult.fold((_) {}, (companies) {
          for (final s in items) {
            counts[s.id] = companies
                .where((c) => c.subServiceIds.contains(s.id))
                .length;
          }
        });
        emit(state.copyWith(
          status: SubServicesStatus.success,
          items: items,
          counts: counts,
        ));
      },
    );
  }
}
