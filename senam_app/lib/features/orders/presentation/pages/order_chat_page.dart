import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';

/// شاشة الدردشة مع الشركة/الفني أثناء تنفيذ الطلب.
class OrderChatPage extends StatefulWidget {
  final String companyName;
  const OrderChatPage({super.key, this.companyName = 'الفخامة لغسيل السيارات'});

  @override
  State<OrderChatPage> createState() => _OrderChatPageState();
}

class _OrderChatPageState extends State<OrderChatPage> {
  final _ctrl = TextEditingController();
  final List<_M> _msgs = [
    _M('السلام عليكم، أنا في الطريق إليك', false, '14:02'),
    _M('وعليكم السلام، كم تبعد تقريباً؟', true, '14:03'),
    _M('5 دقائق بإذن الله', false, '14:03'),
    _M('ممتاز، الفيلا رقم 24 شارع 12', true, '14:04'),
  ];

  static const _quick = [
    'كم تبعد؟',
    'انتظر دقائق',
    'وصلت',
    'شكراً',
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
            CompanyLogo(
                label: widget.companyName.substring(0, 1),
                color: AppColors.gold,
                size: 38),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.companyName,
                      style: const TextStyle(
                          fontSize: 14, fontWeight: FontWeight.w800)),
                  const Text('متصل الآن',
                      style: TextStyle(
                          color: AppColors.success, fontSize: 11)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.call, color: AppColors.gold),
            onPressed: () {},
          ),
        ],
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
                    alignment:
                        m.me ? Alignment.centerLeft : Alignment.centerRight,
                    child: Container(
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                      constraints: BoxConstraints(
                          maxWidth:
                              MediaQuery.of(context).size.width * 0.75),
                      decoration: BoxDecoration(
                        color:
                            m.me ? AppColors.gold : AppColors.surface,
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
                          Row(
                            children: [
                              Text(m.time,
                                  style: TextStyle(
                                      fontSize: 10,
                                      color: m.me
                                          ? const Color(0xFF3D2F00)
                                          : AppColors.textMuted)),
                              if (m.me) ...[
                                const SizedBox(width: 4),
                                const Icon(Icons.done_all,
                                    size: 12,
                                    color: Color(0xFF3D2F00)),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            SizedBox(
              height: 40,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: _quick.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (_, i) => GestureDetector(
                  onTap: () => _send(_quick[i]),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Text(_quick[i],
                        style: const TextStyle(
                            color: AppColors.gold, fontSize: 12)),
                  ),
                ),
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
                      icon: const Icon(Icons.add_photo_alternate_outlined,
                          color: AppColors.textMuted),
                      onPressed: () {},
                    ),
                    Expanded(
                      child: TextField(
                        controller: _ctrl,
                        decoration: const InputDecoration(
                          hintText: 'اكتب رسالة...',
                          border: InputBorder.none,
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: () => _send(_ctrl.text),
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

  void _send(String txt) {
    if (txt.trim().isEmpty) return;
    setState(() {
      _msgs.add(_M(txt.trim(), true, 'الآن'));
      _ctrl.clear();
    });
  }
}

class _M {
  final String text;
  final bool me;
  final String time;
  _M(this.text, this.me, this.time);
}
