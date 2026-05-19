import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';

/// شاشة تقديم شكوى على طلب مكتمل.
class ComplaintPage extends StatefulWidget {
  final String orderNumber;
  const ComplaintPage({super.key, this.orderNumber = '1024'});

  @override
  State<ComplaintPage> createState() => _ComplaintPageState();
}

class _ComplaintPageState extends State<ComplaintPage> {
  int? _type;
  final _desc = TextEditingController();

  static const _types = [
    ('جودة الخدمة منخفضة', Icons.thumb_down_outlined),
    ('تأخر الفني', Icons.access_time),
    ('سلوك غير مناسب', Icons.report_gmailerrorred),
    ('رسوم خاطئة', Icons.payments_outlined),
    ('خدمة غير مكتملة', Icons.warning_amber_rounded),
    ('أخرى', Icons.more_horiz),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text('تقديم شكوى'),
      ),
      body: DarkBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              GradientCard(
                child: Row(
                  children: [
                    const Icon(Icons.receipt_long, color: AppColors.gold),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('طلب #${widget.orderNumber}',
                              style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.w800)),
                          const Text('غسيل سيارات - الفخامة',
                              style: TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const Text('نوع الشكوى',
                  style: TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 15)),
              const SizedBox(height: 12),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _types.length,
                gridDelegate:
                    const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  childAspectRatio: 2.5,
                ),
                itemBuilder: (_, i) {
                  final selected = _type == i;
                  return GestureDetector(
                    onTap: () => setState(() => _type = i),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      decoration: BoxDecoration(
                        color: selected
                            ? AppColors.gold.withValues(alpha: .12)
                            : AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: selected
                                ? AppColors.gold
                                : AppColors.border),
                      ),
                      child: Row(
                        children: [
                          Icon(_types[i].$2,
                              color: selected
                                  ? AppColors.gold
                                  : AppColors.textMuted,
                              size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(_types[i].$1,
                                style: const TextStyle(
                                    color: AppColors.textPrimary,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600)),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 20),
              const Text('وصف الشكوى',
                  style: TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 15)),
              const SizedBox(height: 10),
              TextField(
                controller: _desc,
                maxLines: 5,
                decoration: const InputDecoration(
                  hintText: 'صف لنا ما حدث بالتفصيل...',
                ),
              ),
              const SizedBox(height: 16),
              const Text('إرفاق صور (اختياري)',
                  style: TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 15)),
              const SizedBox(height: 10),
              Row(
                children: [
                  _addImage(),
                  const SizedBox(width: 10),
                  _addImage(),
                  const SizedBox(width: 10),
                  _addImage(),
                ],
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.info.withValues(alpha: .08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                      color: AppColors.info.withValues(alpha: .25)),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.info_outline,
                        color: AppColors.info, size: 18),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'سيتم التواصل معك خلال 24-48 ساعة لمتابعة الشكوى.',
                        style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                            height: 1.5),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _type == null || _desc.text.isEmpty
                      ? null
                      : () {
                          showDialog(
                            context: context,
                            builder: (_) => AlertDialog(
                              backgroundColor: AppColors.surface,
                              title: const Text('تم إرسال الشكوى',
                                  style:
                                      TextStyle(color: AppColors.textPrimary)),
                              content: const Text(
                                  'سيتم التواصل معك قريباً، رقم التذكرة: #SC-3024',
                                  style: TextStyle(
                                      color: AppColors.textSecondary)),
                              actions: [
                                TextButton(
                                  onPressed: () {
                                    Navigator.pop(context);
                                    Navigator.pop(context);
                                  },
                                  child: const Text('حسناً',
                                      style:
                                          TextStyle(color: AppColors.gold)),
                                ),
                              ],
                            ),
                          );
                        },
                  child: const Text('إرسال الشكوى'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _addImage() => Expanded(
        child: GestureDetector(
          onTap: () {},
          child: Container(
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                  color: AppColors.gold.withValues(alpha: .25),
                  style: BorderStyle.solid),
            ),
            child: const Icon(Icons.add_a_photo_outlined,
                color: AppColors.gold),
          ),
        ),
      );
}
