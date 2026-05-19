import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../domain/entities/service_category.dart';
import '../cubit/companies_cubit.dart';
import '../widgets/company_list_card.dart';

/// صفحة عرض شركات تصنيف معيّن.
class CategoryPage extends StatelessWidget {
  final ServiceCategory category;
  const CategoryPage({super.key, required this.category});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<CompaniesCubit>()..load(category.id),
      child: _CategoryView(category: category),
    );
  }
}

class _CategoryView extends StatefulWidget {
  final ServiceCategory category;
  const _CategoryView({required this.category});

  @override
  State<_CategoryView> createState() => _CategoryViewState();
}

class _CategoryViewState extends State<_CategoryView> {
  bool _mapView = false;

  static const _filters = ['الأقرب لك', 'الأعلى تقييماً', 'الأقل سعراً'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.category.name),
        actions: [
          IconButton(
            onPressed: () => setState(() => _mapView = !_mapView),
            icon: Icon(_mapView ? Icons.list : Icons.map_outlined),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'ابحث في ${widget.category.name}',
                prefixIcon:
                    const Icon(Icons.search, color: AppColors.textMuted),
              ),
            ),
          ),
          BlocBuilder<CompaniesCubit, CompaniesState>(
            builder: (context, state) => FilterChips(
              labels: _filters,
              selectedIndex: state.filterIndex,
              rounded: true,
              onSelected: (i) =>
                  context.read<CompaniesCubit>().setFilter(i),
            ),
          ),
          const SizedBox(height: 8),
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
                        state.errorMessage ?? 'حدث خطأ غير متوقع',
                    onRetry: () => context
                        .read<CompaniesCubit>()
                        .load(widget.category.id),
                  );
                }
                if (state.companies.isEmpty) {
                  return const EmptyView(
                      message: 'لا توجد شركات في هذا التصنيف');
                }
                return _mapView
                    ? _buildMap(state)
                    : _buildList(state);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildList(CompaniesState state) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: state.companies.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (_, i) =>
          CompanyListCard(company: state.companies[i]),
    );
  }

  Widget _buildMap(CompaniesState state) {
    return Stack(
      children: [
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF1C1F26), Color(0xFF0F0F11)],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
          child: CustomPaint(
            painter: _MapGridPainter(),
            child: const SizedBox.expand(),
          ),
        ),
        const Positioned(top: 80, right: 60, child: _MapPin()),
        const Positioned(top: 180, left: 80, child: _MapPin()),
        const Positioned(bottom: 220, right: 120, child: _MapPin()),
        Align(
          alignment: Alignment.bottomCenter,
          child: Container(
            margin: const EdgeInsets.all(16),
            child: CompanyListCard(company: state.companies.first),
          ),
        ),
      ],
    );
  }
}

class _MapPin extends StatelessWidget {
  const _MapPin();
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: AppColors.gold,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
              color: AppColors.gold.withValues(alpha: 0.5),
              blurRadius: 12),
        ],
      ),
      child: const Icon(Icons.local_car_wash,
          color: Color(0xFF1A1500), size: 20),
    );
  }
}

class _MapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.border.withValues(alpha: 0.5)
      ..strokeWidth = 1;
    for (double x = 0; x < size.width; x += 40) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += 40) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
