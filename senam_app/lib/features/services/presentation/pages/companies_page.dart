import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../cubit/companies_cubit.dart';
import '../widgets/company_list_card.dart';

/// تبويب "الشركات" — يعرض كل الشركات في التطبيق مع فلاتر الترتيب.
class CompaniesPage extends StatelessWidget {
  const CompaniesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<CompaniesCubit>()..load(''),
      child: const _CompaniesView(),
    );
  }
}

class _CompaniesView extends StatelessWidget {
  const _CompaniesView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الشركات'),
        centerTitle: true,
      ),
      body: Column(
        children: [
          const SizedBox(height: 6),
          const _FilterRow(),
          const SizedBox(height: 6),
          Expanded(
            child: BlocBuilder<CompaniesCubit, CompaniesState>(
              builder: (context, state) {
                if (state.status == CompaniesStatus.loading ||
                    state.status == CompaniesStatus.initial) {
                  return const LoadingView();
                }
                if (state.status == CompaniesStatus.failure) {
                  return ErrorView(
                    message:
                        state.errorMessage ?? 'تعذّر تحميل الشركات',
                    onRetry: () =>
                        context.read<CompaniesCubit>().load(''),
                  );
                }
                if (state.companies.isEmpty) {
                  return const EmptyView(
                    message: 'لا توجد شركات حالياً',
                    icon: Icons.apartment_outlined,
                  );
                }
                return RefreshIndicator(
                  color: AppColors.gold,
                  onRefresh: () =>
                      context.read<CompaniesCubit>().load(''),
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                    itemCount: state.companies.length,
                    separatorBuilder: (_, _) =>
                        const SizedBox(height: 12),
                    itemBuilder: (_, i) =>
                        CompanyListCard(company: state.companies[i]),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterRow extends StatelessWidget {
  const _FilterRow();

  @override
  Widget build(BuildContext context) {
    final chips = const [
      _ChipSpec(label: 'الأكثر تقييماً', icon: Icons.reviews_outlined),
      _ChipSpec(label: 'الأعلى تقييماً', icon: Icons.star_outline),
      _ChipSpec(label: 'الأقرب لي', icon: Icons.location_on_outlined),
    ];
    return SizedBox(
      height: 40,
      child: BlocBuilder<CompaniesCubit, CompaniesState>(
        builder: (context, state) {
          return ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: chips.length,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (_, i) {
              final spec = chips[i];
              final selected = i == state.filterIndex;
              return GestureDetector(
                onTap: () =>
                    context.read<CompaniesCubit>().setFilter(i),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: selected
                        ? AppColors.gold
                        : AppColors.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: selected
                          ? AppColors.gold
                          : AppColors.border,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        spec.icon,
                        size: 14,
                        color: selected
                            ? const Color(0xFF1A1500)
                            : AppColors.textSecondary,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        spec.label,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: selected
                              ? const Color(0xFF1A1500)
                              : AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _ChipSpec {
  final String label;
  final IconData icon;
  const _ChipSpec({required this.label, required this.icon});
}
