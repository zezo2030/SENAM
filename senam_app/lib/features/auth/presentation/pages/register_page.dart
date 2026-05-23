import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../app/main_nav.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../cubit/auth_cubit.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  void _submit(BuildContext context) {
    final name = _name.text.trim();
    final email = _email.text.trim();
    final password = _password.text;
    final confirm = _confirm.text;

    if (name.isEmpty) {
      _showError(context, 'الاسم الكامل مطلوب');
      return;
    }
    if (email.isEmpty || password.isEmpty) {
      _showError(context, 'يرجى تعبئة البريد وكلمة المرور');
      return;
    }
    if (password.length < 8) {
      _showError(context, 'كلمة المرور يجب ألا تقل عن 8 أحرف');
      return;
    }
    if (password != confirm) {
      _showError(context, 'تأكيد كلمة المرور غير مطابق');
      return;
    }

    context.read<AuthCubit>().register(
          email: email,
          password: password,
          displayName: name,
          phone: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
        );
  }

  void _showError(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: AppColors.error),
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
                _showError(context, state.errorMessage ?? 'تعذّر إنشاء الحساب');
              }
            },
            builder: (context, state) {
              final loading = state.status == AuthStatus.submitting;
              return SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_forward_rounded,
                          color: AppColors.textPrimary),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'إنشاء حساب جديد',
                      style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'سجّل بياناتك لتبدأ استخدام تطبيق سنام',
                      style: TextStyle(
                          fontSize: 14, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 28),
                    const _Label('الاسم الكامل *'),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _name,
                      decoration: const InputDecoration(
                        hintText: 'مثال: أحمد محمد',
                        prefixIcon: Icon(Icons.person_outline,
                            color: AppColors.textMuted),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const _Label('البريد الإلكتروني'),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      textDirection: TextDirection.ltr,
                      autocorrect: false,
                      enableSuggestions: false,
                      decoration: const InputDecoration(
                        hintText: 'example@email.com',
                        prefixIcon: Icon(Icons.mail_outline,
                            color: AppColors.textMuted),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const _Label('رقم الجوال (اختياري)'),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _phone,
                      keyboardType: TextInputType.phone,
                      textDirection: TextDirection.ltr,
                      decoration: const InputDecoration(
                        hintText: '+97455512345',
                        prefixIcon: Icon(Icons.phone_outlined,
                            color: AppColors.textMuted),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const _Label('كلمة المرور'),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _password,
                      obscureText: _obscure,
                      textDirection: TextDirection.ltr,
                      decoration: InputDecoration(
                        hintText: '8 أحرف على الأقل',
                        prefixIcon: const Icon(Icons.lock_outline,
                            color: AppColors.textMuted),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscure
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                            color: AppColors.textMuted,
                          ),
                          onPressed: () =>
                              setState(() => _obscure = !_obscure),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const _Label('تأكيد كلمة المرور'),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _confirm,
                      obscureText: _obscure,
                      textDirection: TextDirection.ltr,
                      decoration: const InputDecoration(
                        hintText: '••••••••',
                        prefixIcon: Icon(Icons.lock_outline,
                            color: AppColors.textMuted),
                      ),
                      onSubmitted: (_) => _submit(context),
                    ),
                    const SizedBox(height: 28),
                    ElevatedButton(
                      onPressed: loading ? null : () => _submit(context),
                      child: loading
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  color: Color(0xFF1A1500)),
                            )
                          : const Text('إنشاء الحساب'),
                    ),
                    const SizedBox(height: 16),
                    Center(
                      child: TextButton(
                        onPressed:
                            loading ? null : () => Navigator.pop(context),
                        child: const Text.rich(
                          TextSpan(
                            text: 'لديك حساب بالفعل؟ ',
                            style: TextStyle(color: AppColors.textMuted),
                            children: [
                              TextSpan(
                                text: 'تسجيل الدخول',
                                style: TextStyle(
                                    color: AppColors.gold,
                                    fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                        ),
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

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(text,
        style: const TextStyle(
            color: AppColors.textPrimary, fontWeight: FontWeight.w700));
  }
}
