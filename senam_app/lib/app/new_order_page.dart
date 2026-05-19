import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../core/di/injection_container.dart';
import '../core/theme/app_colors.dart';
import '../core/widgets/app_widgets.dart';
import '../features/home/presentation/cubit/home_cubit.dart';
import '../features/services/presentation/pages/category_page.dart';

/// شاشة "طلب جديد" — اختيار القسم.
class NewOrderPage extends StatelessWidget {
  const NewOrderPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<HomeCubit>()..load(),
      child: Scaffold(
        appBar: AppBar(title: const Text('طلب جديد')),
        body: BlocBuilder<HomeCubit, HomeState>(
          builder: (context, state) {
            if (state.status != HomeStatus.success) {
              return const LoadingView();
            }
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text('اختر القسم المناسب',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary)),
                const SizedBox(height: 4),
                const Text('تصفّح خدماتنا واحجز ما تحتاجه بسهولة',
                    style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary)),
                const SizedBox(height: 18),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.1,
                  children: state.categories.map((cat) {
                    return GestureDetector(
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) =>
                                CategoryPage(category: cat)),
                      ),
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [
                              Color(0xFF26262C),
                              Color(0xFF161618)
                            ],
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                          ),
                          borderRadius: BorderRadius.circular(18),
                          border:
                              Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          mainAxisAlignment:
                              MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 60,
                              height: 60,
                              decoration: BoxDecoration(
                                color: AppColors.gold
                                    .withValues(alpha: 0.12),
                                borderRadius:
                                    BorderRadius.circular(18),
                              ),
                              child: Icon(cat.icon,
                                  color: AppColors.gold,
                                  size: 28),
                            ),
                            const SizedBox(height: 10),
                            Text(cat.name,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 14,
                                    color:
                                        AppColors.textPrimary)),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
