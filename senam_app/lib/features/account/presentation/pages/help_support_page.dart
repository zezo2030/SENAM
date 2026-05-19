import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';

class HelpSupportPage extends StatelessWidget {
  const HelpSupportPage({super.key});

  static const _faqs = [
    ('كيف أحجز خدمة؟',
        'افتح التطبيق، اختر القسم، حدد الشركة، اختر الخدمة والوقت، ثم أكمل الدفع.'),
    ('ما هي سياسة الإلغاء؟',
        'يمكنك الإلغاء مجاناً قبل قبول الشركة للطلب. بعد القبول، تطبق رسوم خدمة.'),
    ('متى يتم تحصيل المبلغ؟',
        'يتم التحصيل عند تأكيد الطلب لطرق الدفع الإلكتروني، أو نقداً عند الوصول.'),
    ('كيف أتواصل مع الفني؟',
        'بعد تأكيد الطلب يمكنك الاتصال أو الدردشة مع الفني من شاشة التتبع.'),
    ('ماذا أفعل إذا واجهتني مشكلة في الخدمة؟',
        'يمكنك فتح شكوى من شاشة الطلب وسيتم الرد خلال 24-48 ساعة.'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text('المساعدة والدعم'),
      ),
      body: DarkBackground(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('كيف يمكننا مساعدتك؟',
                style: TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w800,
                    fontSize: 18)),
            const SizedBox(height: 14),
            Row(
              children: [
                _quick(Icons.chat_bubble_outline, 'محادثة\nمباشرة', () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) => const SupportChatPage()),
                  );
                }),
                const SizedBox(width: 10),
                _quick(Icons.phone_outlined, 'اتصل\nبنا', () {}),
                const SizedBox(width: 10),
                _quick(Icons.mail_outline, 'البريد\nالإلكتروني', () {}),
                const SizedBox(width: 10),
                _quick(Icons.report_gmailerrorred,
                    'بلاغ\nمشكلة', () {}),
              ],
            ),
            const SizedBox(height: 28),
            const Text('الأسئلة الشائعة',
                style: TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w800,
                    fontSize: 16)),
            const SizedBox(height: 12),
            ..._faqs.map((q) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: GradientCard(
                    padding: EdgeInsets.zero,
                    child: Theme(
                      data: Theme.of(context)
                          .copyWith(dividerColor: Colors.transparent),
                      child: ExpansionTile(
                        iconColor: AppColors.gold,
                        collapsedIconColor: AppColors.textMuted,
                        title: Text(q.$1,
                            style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w700)),
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(
                                16, 0, 16, 16),
                            child: Text(q.$2,
                                style: const TextStyle(
                                    color: AppColors.textSecondary,
                                    height: 1.6)),
                          ),
                        ],
                      ),
                    ),
                  ),
                )),
            const SizedBox(height: 12),
            GradientCard(
              onTap: () {},
              child: Row(
                children: [
                  const Icon(Icons.headset_mic_outlined,
                      color: AppColors.gold),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('خدمة عملاء VIP',
                            style: TextStyle(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w800)),
                        SizedBox(height: 2),
                        Text('24/7 - رد فوري للأعضاء الذهبيين',
                            style: TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 12)),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_left,
                      color: AppColors.textMuted),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _quick(IconData icon, String label, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          height: 90,
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
                color: AppColors.gold.withValues(alpha: .15)),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: AppColors.gold),
              const SizedBox(height: 6),
              Text(label,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 11,
                      fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ),
    );
  }
}

class SupportChatPage extends StatefulWidget {
  const SupportChatPage({super.key});
  @override
  State<SupportChatPage> createState() => _SupportChatPageState();
}

class _SupportChatPageState extends State<SupportChatPage> {
  final _ctrl = TextEditingController();
  final List<_Msg> _msgs = [
    _Msg('مرحباً بك في دعم سنام، كيف نخدمك؟', false, '10:24'),
    _Msg('أهلاً، لدي استفسار حول طلبي رقم 1024', true, '10:25'),
    _Msg('بكل سرور، لحظات لمراجعة الطلب.', false, '10:25'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        titleSpacing: 0,
        title: Row(
          children: [
            CircleAvatar(
              backgroundColor: AppColors.gold.withValues(alpha: .15),
              child: const Icon(Icons.support_agent, color: AppColors.gold),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('دعم سنام', style: TextStyle(fontSize: 15)),
                Text('متاح الآن',
                    style: TextStyle(
                        color: AppColors.success, fontSize: 11)),
              ],
            ),
          ],
        ),
      ),
      body: DarkBackground(
        child: Column(
          children: [
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _msgs.length,
                itemBuilder: (_, i) {
                  final m = _msgs[i];
                  return Align(
                    alignment: m.me
                        ? Alignment.centerLeft
                        : Alignment.centerRight,
                    child: Container(
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                      constraints: BoxConstraints(
                          maxWidth:
                              MediaQuery.of(context).size.width * 0.75),
                      decoration: BoxDecoration(
                        color: m.me
                            ? AppColors.gold
                            : AppColors.surface,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(m.text,
                              style: TextStyle(
                                  color: m.me
                                      ? const Color(0xFF1A1500)
                                      : AppColors.textPrimary)),
                          const SizedBox(height: 4),
                          Text(m.time,
                              style: TextStyle(
                                  fontSize: 10,
                                  color: m.me
                                      ? const Color(0xFF3D2F00)
                                      : AppColors.textMuted)),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            SafeArea(
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 8),
                color: AppColors.surface,
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.attach_file,
                          color: AppColors.textMuted),
                      onPressed: () {},
                    ),
                    Expanded(
                      child: TextField(
                        controller: _ctrl,
                        decoration: const InputDecoration(
                          hintText: 'اكتب رسالتك...',
                          border: InputBorder.none,
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: () {
                        if (_ctrl.text.trim().isEmpty) return;
                        setState(() {
                          _msgs.add(_Msg(_ctrl.text.trim(), true, 'الآن'));
                          _ctrl.clear();
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: AppColors.goldGradient,
                        ),
                        child: const Icon(Icons.send,
                            color: Color(0xFF1A1500), size: 20),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Msg {
  final String text;
  final bool me;
  final String time;
  _Msg(this.text, this.me, this.time);
}
