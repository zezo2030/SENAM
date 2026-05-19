import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../app/main_nav.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../cubit/auth_cubit.dart';

class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<AuthCubit>(),
      child: const _LoginView(),
    );
  }
}

class _LoginView extends StatefulWidget {
  const _LoginView();

  @override
  State<_LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<_LoginView> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _submit(BuildContext context) {
    context.read<AuthCubit>().login(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DarkBackground(
        child: SafeArea(
          child: BlocConsumer<AuthCubit, AuthState>(
            listener: (context, state) {
              if (state.status == AuthStatus.authenticated) {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => const MainNav()),
                  (route) => false,
                );
              } else if (state.status == AuthStatus.error) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(state.errorMessage ?? 'حدث خطأ'),
                    backgroundColor: AppColors.error,
                  ),
                );
              }
            },
            builder: (context, state) {
              final loading = state.status == AuthStatus.loading;
              return SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 30),
                    const Center(child: SenamLogo(fontSize: 26)),
                    const SizedBox(height: 50),
                    const Text(
                      'تسجيل الدخول',
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'أدخل بريدك الإلكتروني وكلمة المرور للمتابعة',
                      style: TextStyle(
                          fontSize: 14, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 36),

                    // البريد الإلكتروني
                    const _FieldLabel('البريد الإلكتروني'),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      textDirection: TextDirection.ltr,
                      style: const TextStyle(
                          color: AppColors.textPrimary, fontSize: 15),
                      decoration: const InputDecoration(
                        hintText: 'example@email.com',
                        prefixIcon: Icon(Icons.mail_outline,
                            color: AppColors.textMuted),
                      ),
                    ),
                    const SizedBox(height: 18),

                    // كلمة المرور
                    const _FieldLabel('كلمة المرور'),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _passwordController,
                      obscureText: _obscure,
                      textDirection: TextDirection.ltr,
                      style: const TextStyle(
                          color: AppColors.textPrimary, fontSize: 15),
                      decoration: InputDecoration(
                        hintText: '••••••••',
                        prefixIcon: const Icon(Icons.lock_outline,
                            color: AppColors.textMuted),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscure
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                            color: AppColors.textMuted,
                          ),
                          onPressed: () =>
                              setState(() => _obscure = !_obscure),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: TextButton(
                        onPressed: () {},
                        child: const Text('نسيت كلمة المرور؟',
                            style: TextStyle(color: AppColors.gold)),
                      ),
                    ),
                    const SizedBox(height: 14),
                    ElevatedButton(
                      onPressed:
                          loading ? null : () => _submit(context),
                      child: loading
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  color: Color(0xFF1A1500)),
                            )
                          : const Text('تسجيل الدخول'),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      children: const [
                        Expanded(
                            child: Divider(color: AppColors.border)),
                        Padding(
                          padding:
                              EdgeInsets.symmetric(horizontal: 12),
                          child: Text('أو',
                              style: TextStyle(
                                  color: AppColors.textMuted)),
                        ),
                        Expanded(
                            child: Divider(color: AppColors.border)),
                      ],
                    ),
                    const SizedBox(height: 24),
                    _SocialButton(
                      icon: Icons.apple,
                      label: 'المتابعة عبر Apple',
                      onTap: loading
                          ? null
                          : () => context.read<AuthCubit>().login(
                              email: 'apple@senam.qa',
                              password: '123456'),
                    ),
                    const SizedBox(height: 12),
                    _SocialButton(
                      icon: Icons.g_mobiledata,
                      label: 'المتابعة عبر Google',
                      onTap: loading
                          ? null
                          : () => context.read<AuthCubit>().login(
                              email: 'google@senam.qa',
                              password: '123456'),
                    ),
                    const SizedBox(height: 24),
                    Center(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('ليس لديك حساب؟ ',
                              style: TextStyle(
                                  color:
                                      AppColors.textSecondary)),
                          GestureDetector(
                            onTap: () {},
                            child: const Text(
                              'إنشاء حساب',
                              style: TextStyle(
                                  color: AppColors.gold,
                                  fontWeight: FontWeight.w700),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  final String text;
  const _FieldLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(text,
        style: const TextStyle(
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary));
  }
}

class _SocialButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  const _SocialButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 52,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.textPrimary, size: 24),
            const SizedBox(width: 10),
            Text(label,
                style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}
