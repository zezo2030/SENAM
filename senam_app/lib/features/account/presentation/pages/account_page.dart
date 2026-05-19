import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:senam_app/features/auth/presentation/pages/login_page.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../domain/entities/user_profile.dart';
import '../cubit/account_cubit.dart';
import 'about_page.dart';
import 'addresses_page.dart';
import 'coupons_page.dart';
import 'edit_profile_page.dart';
import 'help_support_page.dart';
import 'notifications_page.dart';
import 'payment_methods_page.dart';
import 'referral_page.dart';
import 'settings_page.dart';
import 'wallet_page.dart';

class AccountPage extends StatelessWidget {
  const AccountPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<AccountCubit>()..load(),
      child: const AccountView(),
    );
  }
}

class AccountView extends StatelessWidget {
  const AccountView({super.key});

  @override
  Widget build(BuildContext context) {
    return DarkBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          automaticallyImplyLeading: false,
          title: const Text(
            'الملف الشخصي',
            style: TextStyle(
              fontFamily: 'ElMessiri',
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          centerTitle: true,
          actions: [
            IconButton(
              icon: const Icon(Icons.notifications_outlined, color: AppColors.gold),
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const NotificationsPage()),
              ),
            ),
            const SizedBox(width: 8),
          ],
        ),
        body: BlocBuilder<AccountCubit, AccountState>(
          builder: (context, state) {
            if (state.status == AccountStatus.loading ||
                state.status == AccountStatus.initial) {
              return const LoadingView();
            }
            if (state.status == AccountStatus.failure) {
              return ErrorView(
                message: state.errorMessage ?? 'حدث خطأ',
                onRetry: () => context.read<AccountCubit>().load(),
              );
            }
            return _buildContent(context, state.profile);
          },
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, UserProfile? profile) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        children: [
          // Profile Header Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface.withValues(alpha: 0.65),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.gold.withValues(alpha: 0.12)),
            ),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(35),
                  child: Image.asset(
                    'assets/images/profile/default_avatar.png',
                    width: 70,
                    height: 70,
                    fit: BoxFit.cover,
                    errorBuilder: (c, e, s) => Container(
                      width: 70,
                      height: 70,
                      color: AppColors.gold.withValues(alpha: 0.15),
                      child: const Icon(Icons.person, color: AppColors.gold, size: 36),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        profile?.name ?? 'محمد علي',
                        style: const TextStyle(
                          fontFamily: 'ElMessiri',
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        profile?.phone ?? '+974 5555 1234',
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppColors.textMuted,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const TagPill(
                        text: 'عضو VIP ذهبي',
                        icon: Icons.workspace_premium,
                        color: AppColors.gold,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.edit_outlined, color: AppColors.gold),
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const EditProfilePage()),
                  ),
                ),
              ],
            ),
          ),
          
          // Loyalty Card Section (كرت العضوية)
          Container(
            width: double.infinity,
            height: 190,
            margin: const EdgeInsets.only(top: 16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              image: const DecorationImage(
                image: AssetImage('assets/images/profile/vip_card.png'),
                fit: BoxFit.cover,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.gold.withValues(alpha: 0.12),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.black.withValues(alpha: 0.4),
                      Colors.transparent,
                      Colors.black.withValues(alpha: 0.6),
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'بطاقة ولاء سنام',
                          style: TextStyle(
                            fontFamily: 'ElMessiri',
                            color: AppColors.gold,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Icon(
                          Icons.workspace_premium_rounded,
                          color: AppColors.gold,
                          size: 28,
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'الرصيد الحالي',
                          style: TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text(
                              '1,450 نقطة',
                              style: TextStyle(
                                fontFamily: 'ElMessiri',
                                color: AppColors.textPrimary,
                                fontSize: 26,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                gradient: AppColors.goldGradient,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Text(
                                'استبدال النقاط',
                                style: TextStyle(
                                  color: Color(0xFF1A1500),
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Quick Stats Row
          Container(
            margin: const EdgeInsets.only(top: 16),
            child: Row(
              children: [
                _buildStatItem('المحفظة', '250 ر.ق', Icons.account_balance_wallet_outlined),
                const SizedBox(width: 12),
                _buildStatItem('طلباتي', '3 نشطة', Icons.receipt_long_outlined),
                const SizedBox(width: 12),
                _buildStatItem('الكوبونات', '2 متوفر', Icons.local_offer_outlined),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Settings Options Groups
          _group([
            _item(Icons.person_outline_rounded, 'تعديل الملف الشخصي',
                () => _push(context, const EditProfilePage())),
            _item(Icons.location_on_outlined, 'العناوين المسجلة',
                () => _push(context, const AddressesPage())),
            _item(Icons.payment_outlined, 'طرق الدفع',
                () => _push(context, const PaymentMethodsPage())),
            _item(Icons.account_balance_wallet_outlined, 'محفظتي',
                () => _push(context, const WalletPage())),
          ]),

          const SizedBox(height: 16),

          _group([
            _item(Icons.local_offer_outlined, 'كوبوناتي',
                () => _push(context, const CouponsPage())),
            _item(Icons.card_giftcard_rounded, 'ادعُ صديقاً',
                () => _push(context, const ReferralPage())),
          ]),

          const SizedBox(height: 16),

          _group([
            _item(Icons.notifications_none_rounded, 'الإشعارات',
                () => _push(context, const NotificationsPage())),
            _item(Icons.settings_outlined, 'الإعدادات',
                () => _push(context, const SettingsPage())),
          ]),

          const SizedBox(height: 16),

          _group([
            _item(Icons.help_outline_rounded, 'المساعدة والدعم',
                () => _push(context, const HelpSupportPage())),
            _item(Icons.info_outline_rounded, 'عن سنام',
                () => _push(context, const AboutPage())),
          ]),
          
          const SizedBox(height: 24),
          
          // Logout Button
          Container(
            width: double.infinity,
            height: 50,
            child: OutlinedButton.icon(
              onPressed: () {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const LoginPage()),
                );
              },
              icon: const Icon(Icons.logout_rounded, color: Colors.redAccent, size: 20),
              label: const Text(
                'تسجيل الخروج',
                style: TextStyle(
                  color: Colors.redAccent,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: Colors.redAccent.withValues(alpha: 0.35)),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                backgroundColor: Colors.redAccent.withValues(alpha: 0.04),
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface.withValues(alpha: 0.65),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.gold.withValues(alpha: 0.1)),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.gold, size: 22),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                color: AppColors.textMuted,
                fontSize: 11,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: const TextStyle(
                fontFamily: 'ElMessiri',
                color: AppColors.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _push(BuildContext context, Widget page) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => page));
  }

  Widget _group(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface.withValues(alpha: 0.65),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.08)),
      ),
      child: Column(
        children: children,
      ),
    );
  }

  Widget _item(IconData icon, String title, VoidCallback onTap) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.gold.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: AppColors.gold, size: 20),
      ),
      title: Text(
        title,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: AppColors.textPrimary,
        ),
      ),
      trailing: const Icon(
        Icons.chevron_left,
        color: AppColors.textMuted,
        size: 20,
      ),
      onTap: onTap,
    );
  }
}
