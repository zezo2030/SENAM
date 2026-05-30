import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../domain/entities/sub_service.dart';
import '../cubit/companies_cubit.dart';
import '../widgets/company_list_card.dart';

/// صفحة الخدمة الفرعية: تعرض شركات تقدّم هذه الخدمة بالذات.
class SubServicePage extends StatelessWidget {
  final SubService subService;
  const SubServicePage({super.key, required this.subService});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) =>
          sl<CompaniesCubit>()..loadBySubService(subService.id),
      child: _SubServiceView(subService: subService),
    );
  }
}

class _SubServiceView extends StatelessWidget {
  final SubService subService;
  const _SubServiceView({required this.subService});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(subService.name),
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
                    message: state.errorMessage ?? 'حدث خطأ غير متوقع',
                    onRetry: () => context
                        .read<CompaniesCubit>()
                        .loadBySubService(subService.id),
                  );
                }
                if (state.companies.isEmpty) {
                  return const EmptyView(
                      message: 'لا توجد شركات لهذه الخدمة بعد');
                }
                final detailsLabel = _detailsLabelFor(subService.id);
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  itemCount: state.companies.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (_, i) => CompanyListCard(
                    company: state.companies[i],
                    detailsLabel: detailsLabel,
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  String _detailsLabelFor(String id) {
    // المطابخ والديكور والمشاريع المنزلية: "عرض التصاميم"؛ غيرها: "عرض الأعمال".
    const designIds = {
      'home_kitchen',
      'home_decor',
      'home_gypsum',
      'home_paint',
      'home_pergola',
      'home_flooring',
      'home_gardens',
      'home_restore',
    };
    if (designIds.contains(id)) return 'عرض التصاميم';
    return 'عرض الأعمال';
  }
}

class _FilterRow extends StatelessWidget {
  const _FilterRow();

  @override
  Widget build(BuildContext context) {
    final chips = [
      _ChipSpec(label: 'فلترة', icon: Icons.tune, value: -1),
      _ChipSpec(label: 'الأعلى تقييماً', icon: Icons.star_outline, value: 0),
      _ChipSpec(label: 'الأقرب لي', icon: Icons.location_on_outlined, value: 1),
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
              final isFilter = spec.value == -1;
              final selected =
                  !isFilter && spec.value == state.filterIndex;
              return GestureDetector(
                onTap: () {
                  if (isFilter) return;
                  context.read<CompaniesCubit>().setFilter(spec.value);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: selected ? AppColors.gold : AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: selected
                            ? AppColors.gold
                            : AppColors.border),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        spec.label,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: selected
                              ? const Color(0xFF1A1500)
                              : AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Icon(
                        spec.icon,
                        size: 14,
                        color: selected
                            ? const Color(0xFF1A1500)
                            : AppColors.gold,
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
  final int value;
  const _ChipSpec({
    required this.label,
    required this.icon,
    required this.value,
  });
}
