import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/config/media_url.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../domain/entities/service_category.dart';
import '../../domain/entities/sub_service.dart';
import '../cubit/sub_services_cubit.dart';
import 'sub_service_page.dart';

/// صفحة التصنيف: تعرض الخدمات الفرعية لتصنيف معيّن بشكل كروت بصورة وعدد الشركات.
class CategoryPage extends StatelessWidget {
  final ServiceCategory category;
  const CategoryPage({super.key, required this.category});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<SubServicesCubit>()..load(category.id),
      child: _CategoryView(category: category),
    );
  }
}

class _CategoryView extends StatelessWidget {
  final ServiceCategory category;
  const _CategoryView({required this.category});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(category.name),
        centerTitle: true,
      ),
      body: BlocBuilder<SubServicesCubit, SubServicesState>(
        builder: (context, state) {
          if (state.status == SubServicesStatus.loading ||
              state.status == SubServicesStatus.initial) {
            return const LoadingView();
          }
          if (state.status == SubServicesStatus.failure) {
            return ErrorView(
              message:
                  state.errorMessage ?? 'تعذّر تحميل الخدمات',
              onRetry: () =>
                  context.read<SubServicesCubit>().load(category.id),
            );
          }
          if (state.items.isEmpty) {
            return const EmptyView(message: 'لا توجد خدمات بعد');
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            children: [
              const _Header(),
              const SizedBox(height: 14),
              ...state.items.map(
                (s) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _SubServiceCard(
                    subService: s,
                    count: state.counts[s.id] ?? 0,
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: const [
        Text(
          'اختر نوع الخدمة',
          style: TextStyle(
            color: AppColors.gold,
            fontSize: 16,
            fontWeight: FontWeight.w800,
          ),
        ),
        SizedBox(height: 4),
        Text(
          'تصفح الشركات المختصة في كل مجال',
          style: TextStyle(
            color: AppColors.textSecondary,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}

class _SubServiceCard extends StatelessWidget {
  final SubService subService;
  final int count;
  const _SubServiceCard({
    required this.subService,
    required this.count,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => SubServicePage(subService: subService),
        ),
      ),
      child: Container(
        height: 90,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        clipBehavior: Clip.antiAlias,
        child: Row(
          children: [
            // الصورة على يسار البطاقة (نهاية الصف في RTL)
            SizedBox(
              width: 110,
              height: double.infinity,
              child: _Thumb(subService: subService),
            ),
            const SizedBox(width: 12),
            // النص في الوسط
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    subService.name,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$count شركة',
                    style: const TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            // الأيقونة على يمين البطاقة (بداية الصف في RTL)
            Container(
              margin: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.gold.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                    color: AppColors.gold.withValues(alpha: 0.3)),
              ),
              alignment: Alignment.center,
              clipBehavior: Clip.antiAlias,
              child: subService.iconUrl.isNotEmpty
                  ? SizedBox.expand(
                      child: CachedNetworkImage(
                        imageUrl: subService.iconUrl,
                        fit: BoxFit.cover,
                        errorWidget: (c, e, s) => Icon(subService.icon,
                            color: AppColors.gold, size: 20),
                      ),
                    )
                  : Icon(subService.icon,
                      color: AppColors.gold, size: 20),
            ),
          ],
        ),
      ),
    );
  }
}

class _Thumb extends StatelessWidget {
  final SubService subService;
  const _Thumb({required this.subService});

  @override
  Widget build(BuildContext context) {
    if (subService.imageUrl.isNotEmpty) {
      return CachedNetworkImage(
        imageUrl: resolveMediaUrl(subService.imageUrl),
        fit: BoxFit.cover,
        errorWidget: (c, e, s) => _placeholder(),
        placeholder: (c, url) => _placeholder(),
      );
    }
    if (subService.thumbnail.isNotEmpty) {
      return Image.asset(
        subService.thumbnail,
        fit: BoxFit.cover,
        errorBuilder: (c, e, s) => _placeholder(),
      );
    }
    return _placeholder();
  }

  Widget _placeholder() => Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF26262C), Color(0xFF161618)],
          ),
        ),
        alignment: Alignment.center,
        child: Icon(subService.icon,
            color: AppColors.gold.withValues(alpha: 0.6), size: 28),
      );
}
