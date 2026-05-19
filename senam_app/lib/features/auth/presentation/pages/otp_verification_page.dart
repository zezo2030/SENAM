import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import 'complete_profile_page.dart';

/// شاشة التحقق من رمز OTP المرسل عبر SMS (6 أرقام).
class OtpVerificationPage extends StatefulWidget {
  final String phone;
  const OtpVerificationPage({super.key, this.phone = '+974 5555 1234'});

  @override
  State<OtpVerificationPage> createState() => _OtpVerificationPageState();
}

class _OtpVerificationPageState extends State<OtpVerificationPage> {
  final List<TextEditingController> _controllers =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _nodes = List.generate(6, (_) => FocusNode());
  int _seconds = 45;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _start();
  }

  void _start() {
    _seconds = 45;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_seconds == 0) {
        t.cancel();
      } else {
        setState(() => _seconds--);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (final c in _controllers) c.dispose();
    for (final n in _nodes) n.dispose();
    super.dispose();
  }

  void _onChanged(int i, String v) {
    if (v.isNotEmpty && i < 5) _nodes[i + 1].requestFocus();
    if (v.isEmpty && i > 0) _nodes[i - 1].requestFocus();
    setState(() {});
  }

  bool get _complete => _controllers.every((c) => c.text.isNotEmpty);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DarkBackground(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_forward_rounded,
                      color: AppColors.textPrimary),
                  onPressed: () => Navigator.pop(context),
                ),
                const SizedBox(height: 20),
                const Text('رمز التحقق',
                    style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary)),
                const SizedBox(height: 10),
                Text('أدخل الرمز المرسل إلى ${widget.phone}',
                    style: const TextStyle(
                        fontSize: 14, color: AppColors.textSecondary)),
                const SizedBox(height: 40),
                Directionality(
                  textDirection: TextDirection.ltr,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: List.generate(6, (i) {
                      return SizedBox(
                        width: 48,
                        height: 56,
                        child: TextField(
                          controller: _controllers[i],
                          focusNode: _nodes[i],
                          textAlign: TextAlign.center,
                          keyboardType: TextInputType.number,
                          maxLength: 1,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly
                          ],
                          style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 22,
                              fontWeight: FontWeight.w800),
                          decoration: InputDecoration(
                            counterText: '',
                            filled: true,
                            fillColor: AppColors.surface,
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide:
                                  const BorderSide(color: AppColors.border),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide:
                                  const BorderSide(color: AppColors.gold),
                            ),
                          ),
                          onChanged: (v) => _onChanged(i, v),
                        ),
                      );
                    }),
                  ),
                ),
                const SizedBox(height: 30),
                Center(
                  child: _seconds > 0
                      ? Text('إعادة الإرسال خلال 00:${_seconds.toString().padLeft(2, '0')}',
                          style: const TextStyle(color: AppColors.textMuted))
                      : TextButton(
                          onPressed: _start,
                          child: const Text('إعادة إرسال الرمز',
                              style: TextStyle(
                                  color: AppColors.gold,
                                  fontWeight: FontWeight.w700)),
                        ),
                ),
                const Spacer(),
                ElevatedButton(
                  onPressed: !_complete
                      ? null
                      : () => Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                                builder: (_) => const CompleteProfilePage()),
                          ),
                  child: const Text('تحقق'),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
