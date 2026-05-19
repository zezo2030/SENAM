import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../../services/presentation/widgets/company_list_card.dart';
import '../cubit/favorites_cubit.dart';

class FavoritesPage extends StatelessWidget {
  const FavoritesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<FavoritesCubit>()..load(),
      child: Scaffold(
        appBar: AppBar(title: const Text('المفضلة')),
        body: BlocBuilder<FavoritesCubit, FavoritesState>(
          builder: (context, state) {
            switch (state.status) {
              case FavoritesStatus.loading:
              case FavoritesStatus.initial:
                return const LoadingView();
              case FavoritesStatus.failure:
                return ErrorView(
                  message: state.errorMessage ?? 'تعذّر التحميل',
                  onRetry: () =>
                      context.read<FavoritesCubit>().load(),
                );
              case FavoritesStatus.success:
                if (state.companies.isEmpty) {
                  return const EmptyView(
                    message: 'لا توجد شركات مفضلة',
                    icon: Icons.favorite_border,
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: state.companies.length,
                  separatorBuilder: (_, _) =>
                      const SizedBox(height: 12),
                  itemBuilder: (_, i) =>
                      CompanyListCard(company: state.companies[i]),
                );
            }
          },
        ),
      ),
    );
  }
}
