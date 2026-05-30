import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../../auth/presentation/pages/login_page.dart';
import '../../../auth/presentation/pages/register_page.dart';
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
              case FavoritesStatus.guest:
                return _GuestCtaView(
                  onAuthSucceeded: () =>
                      context.read<FavoritesCubit>().load(),
                );
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

/// شاشة CTA تظهر للزائر داخل تبويب المفضلة —
/// تطلب منه تسجيل الدخول أو إنشاء حساب لحفظ الشركات المفضلة.
class _GuestCtaView extends StatelessWidget {
  final VoidCallback onAuthSucceeded;
  const _GuestCtaView({required this.onAuthSucceeded});

  Future<void> _openLogin(BuildContext context) async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const LoginPage()),
    );
    onAuthSucceeded();
  }

  Future<void> _openRegister(BuildContext context) async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const RegisterPage()),
    );
    onAuthSucceeded();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 32, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            width: 110,
            height: 110,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  AppColors.gold.withValues(alpha: 0.18),
                  Colors.transparent,
                ],
              ),
            ),
            child: Container(
              width: 70,
              height: 70,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.goldGradient,
              ),
              child: const Icon(Icons.favorite_rounded,
                  size: 34, color: Color(0xFF1A1500)),
            ),
          ),
          const SizedBox(height: 18),
          const Text(
            'سجّل الدخول لحفظ مفضلتك',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'ElMessiri',
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'سجّل الدخول أو أنشئ حساباً لتتمكن من حفظ الشركات\n'
            'المفضلة لديك والوصول إليها بسرعة في أي وقت.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              height: 1.7,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 28),
          ElevatedButton.icon(
            onPressed: () => _openLogin(context),
            icon: const Icon(Icons.login_rounded,
                color: Color(0xFF1A1500), size: 20),
            label: const Text('تسجيل الدخول'),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => _openRegister(context),
            icon: const Icon(Icons.person_add_alt_1_outlined,
                color: AppColors.gold, size: 20),
            label: const Text(
              'إنشاء حساب جديد',
              style: TextStyle(
                  color: AppColors.gold, fontWeight: FontWeight.w700),
            ),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppColors.gold),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
