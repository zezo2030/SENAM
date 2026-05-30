import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

/// يبني رابط محادثة واتساب من قيمة مخزّنة قد تكون:
///  - رقمًا (مثال: "+974 5555 1234" أو "97455551234")، أو
///  - رابط wa.me / api.whatsapp كامل (بيانات قديمة).
/// يرجّع null لو القيمة فاضية أو مفيهاش أرقام.
Uri? buildWhatsAppUri(String raw) {
  final value = raw.trim();
  if (value.isEmpty) return null;

  // بيانات قديمة محفوظة كرابط كامل — نفتحها كما هي.
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return Uri.tryParse(value);
  }

  // غير ذلك نعامل القيمة كرقم: نشيل أي رموز ونبني رابط wa.me.
  final digits = value.replaceAll(RegExp(r'[^0-9]'), '');
  if (digits.isEmpty) return null;
  return Uri.parse('https://wa.me/$digits');
}

/// يفتح محادثة واتساب الشركة مباشرة في تطبيق واتساب.
/// يعرض SnackBar لو الرقم غير موجود أو تعذّر الفتح.
Future<void> openWhatsApp(BuildContext context, String raw) async {
  final messenger = ScaffoldMessenger.of(context);
  final uri = buildWhatsAppUri(raw);
  if (uri == null) {
    messenger.showSnackBar(
      const SnackBar(content: Text('لا يوجد رقم واتساب لهذه الشركة')),
    );
    return;
  }
  try {
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok) {
      messenger.showSnackBar(
        const SnackBar(content: Text('تعذّر فتح واتساب')),
      );
    }
  } catch (_) {
    messenger.showSnackBar(
      const SnackBar(content: Text('تعذّر فتح واتساب')),
    );
  }
}
