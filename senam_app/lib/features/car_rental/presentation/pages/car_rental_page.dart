import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../domain/entities/car_rental.dart';
import '../cubit/car_rental_cubit.dart';

class CarRentalPage extends StatelessWidget {
  const CarRentalPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<CarRentalCubit>()..load(),
      child: const _CarRentalView(),
    );
  }
}

class _CarRentalView extends StatelessWidget {
  const _CarRentalView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('تأجير سيارات')),
      body: BlocBuilder<CarRentalCubit, CarRentalState>(
        builder: (context, state) {
          if (state.status == CarRentalStatus.loading ||
              state.status == CarRentalStatus.initial) {
            return const LoadingView();
          }
          if (state.status == CarRentalStatus.failure) {
            return ErrorView(
              message: state.errorMessage ?? 'حدث خطأ',
              onRetry: () => context.read<CarRentalCubit>().load(),
            );
          }
          final cars = state.filteredCars;
          return Column(
            children: [
              Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  gradient: const LinearGradient(
                    colors: [Color(0xFF2D2A22), Color(0xFF111110)],
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text('تجربة قيادة فاخرة',
                              style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.textPrimary)),
                          SizedBox(height: 6),
                          Text('تناسب احتياجك — تأمين شامل وتوصيل مجاني',
                              style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                    Icon(Icons.directions_car,
                        size: 56,
                        color: AppColors.gold.withValues(alpha: 0.35)),
                  ],
                ),
              ),
              SizedBox(
                height: 40,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: CarRentalState.filterTypes.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, i) {
                    final selected = i == state.filterIndex;
                    return GestureDetector(
                      onTap: () =>
                          context.read<CarRentalCubit>().setFilter(i),
                      child: Container(
                        padding:
                            const EdgeInsets.symmetric(horizontal: 16),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: selected
                              ? AppColors.gold
                              : AppColors.surface,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                              color: selected
                                  ? AppColors.gold
                                  : AppColors.border),
                        ),
                        child: Text(CarRentalState.filterTypes[i],
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: selected
                                    ? const Color(0xFF1A1500)
                                    : AppColors.textSecondary)),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: cars.isEmpty
                    ? const EmptyView(message: 'لا توجد سيارات')
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: cars.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: 12),
                        itemBuilder: (_, i) => _CarCard(car: cars[i]),
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _CarCard extends StatelessWidget {
  final CarRental car;
  const _CarCard({required this.car});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Container(
            height: 110,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  car.color.withValues(alpha: 0.4),
                  AppColors.surfaceLight,
                ],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Icon(Icons.directions_car,
                  size: 56,
                  color: Colors.white.withValues(alpha: 0.5)),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Text(car.name,
                    style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        color: AppColors.textPrimary)),
              ),
              const Icon(Icons.favorite_border,
                  color: AppColors.textMuted, size: 20),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _spec(Icons.event_seat, '${car.seats} مقاعد'),
              const SizedBox(width: 14),
              _spec(Icons.settings, car.transmission),
              const SizedBox(width: 14),
              _spec(Icons.category_outlined, car.type),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 10),
            child: Divider(color: AppColors.border, height: 1),
          ),
          Row(
            children: [
              Text('${car.pricePerDay} ر.ق',
                  style: const TextStyle(
                      color: AppColors.gold,
                      fontWeight: FontWeight.w900,
                      fontSize: 17)),
              const Text(' / يوم',
                  style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textMuted)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 20, vertical: 9),
                decoration: BoxDecoration(
                  gradient: AppColors.goldGradient,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text('احجز الآن',
                    style: TextStyle(
                        color: Color(0xFF1A1500),
                        fontWeight: FontWeight.w800,
                        fontSize: 13)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _spec(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 13, color: AppColors.textMuted),
        const SizedBox(width: 3),
        Text(text,
            style: const TextStyle(
                fontSize: 11, color: AppColors.textSecondary)),
      ],
    );
  }
}
