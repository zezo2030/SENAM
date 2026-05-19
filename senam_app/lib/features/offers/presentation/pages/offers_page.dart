import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../domain/entities/offer.dart';
import '../cubit/offers_cubit.dart';

class OffersPage extends StatelessWidget {
  const OffersPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<OffersCubit>()..load(),
      child: const _OffersView(),
    );
  }
}

class _OffersView extends StatelessWidget {
  const _OffersView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text('العروض والكوبونات'),
      ),
      body: BlocBuilder<OffersCubit, OffersState>(
        builder: (context, state) {
          if (state.status == OffersStatus.loading ||
              state.status == OffersStatus.initial) {
            return const LoadingView();
          }
          if (state.status == OffersStatus.failure) {
            return ErrorView(
              message: state.errorMessage ?? 'حدث خطأ',
              onRetry: () => context.read<OffersCubit>().load(),
            );
          }
          if (state.offers.isEmpty) {
            return const EmptyView(message: 'لا توجد عروض حالياً');
          }
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              for (final offer in state.offers) ...[
                _OfferCard(offer: offer),
                const SizedBox(height: 14),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _OfferCard extends StatelessWidget {
  final Offer offer;
  const _OfferCard({required this.offer});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: const LinearGradient(
          colors: [Color(0xFF2D2A22), Color(0xFF161410)],
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
        ),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.35)),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(18),
            child: Row(
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    gradient: AppColors.goldGradient,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: Text(offer.discount,
                        style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF1A1500))),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(offer.title,
                          style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 15,
                              color: AppColors.textPrimary)),
                      const SizedBox(height: 4),
                      Text(offer.subtitle,
                          style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Container(
            margin: const EdgeInsets.fromLTRB(18, 0, 18, 18),
            padding: const EdgeInsets.symmetric(
                horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.background.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                  color: AppColors.gold.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.confirmation_number_outlined,
                    color: AppColors.gold, size: 18),
                const SizedBox(width: 8),
                Text(offer.code,
                    style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                        color: AppColors.gold)),
                const Spacer(),
                GestureDetector(
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('تم نسخ الكود ${offer.code}'),
                        backgroundColor: AppColors.surfaceHigh,
                      ),
                    );
                  },
                  child: const Text('نسخ',
                      style: TextStyle(
                          color: AppColors.gold,
                          fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
