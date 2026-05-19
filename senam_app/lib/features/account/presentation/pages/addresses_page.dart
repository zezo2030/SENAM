import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';

/// قائمة العناوين المحفوظة + إضافة/تعديل عنوان جديد.
class AddressesPage extends StatefulWidget {
  const AddressesPage({super.key});

  @override
  State<AddressesPage> createState() => _AddressesPageState();
}

class _AddressesPageState extends State<AddressesPage> {
  final List<_Address> _addresses = [
    _Address('المنزل', 'الدوحة - الوعب، شارع 12، فيلا 24',
        Icons.home_rounded, true),
    _Address('العمل', 'الخليج الغربي - برج المرقاب، الدور 8',
        Icons.work_outline_rounded, false),
    _Address('الوالد', 'الريان - منطقة 26، شارع 102', Icons.location_on, false),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text('العناوين المحفوظة'),
      ),
      body: DarkBackground(
        child: ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: _addresses.length,
          separatorBuilder: (_, _) => const SizedBox(height: 12),
          itemBuilder: (_, i) {
            final a = _addresses[i];
            return GradientCard(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.gold.withValues(alpha: .12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(a.icon, color: AppColors.gold),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(a.label,
                                style: const TextStyle(
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 15)),
                            const SizedBox(width: 8),
                            if (a.primary)
                              const TagPill(
                                  text: 'افتراضي', icon: Icons.check_circle),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(a.address,
                            style: const TextStyle(
                                color: AppColors.textSecondary, fontSize: 13)),
                      ],
                    ),
                  ),
                  PopupMenuButton<String>(
                    color: AppColors.surfaceLight,
                    icon: const Icon(Icons.more_vert,
                        color: AppColors.textMuted),
                    onSelected: (v) {
                      if (v == 'delete') {
                        setState(() => _addresses.removeAt(i));
                      } else if (v == 'default') {
                        setState(() {
                          for (var x in _addresses) x.primary = false;
                          a.primary = true;
                        });
                      }
                    },
                    itemBuilder: (_) => const [
                      PopupMenuItem(
                          value: 'edit',
                          child: Text('تعديل',
                              style: TextStyle(color: AppColors.textPrimary))),
                      PopupMenuItem(
                          value: 'default',
                          child: Text('جعله افتراضياً',
                              style: TextStyle(color: AppColors.textPrimary))),
                      PopupMenuItem(
                          value: 'delete',
                          child: Text('حذف',
                              style: TextStyle(color: Colors.redAccent))),
                    ],
                  ),
                ],
              ),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.gold,
        foregroundColor: const Color(0xFF1A1500),
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const AddAddressPage()),
        ),
        icon: const Icon(Icons.add_location_alt_outlined),
        label: const Text('إضافة عنوان',
            style: TextStyle(fontWeight: FontWeight.w800)),
      ),
    );
  }
}

class _Address {
  final String label;
  final String address;
  final IconData icon;
  bool primary;
  _Address(this.label, this.address, this.icon, this.primary);
}

class AddAddressPage extends StatefulWidget {
  const AddAddressPage({super.key});
  @override
  State<AddAddressPage> createState() => _AddAddressPageState();
}

class _AddAddressPageState extends State<AddAddressPage> {
  String _type = 'home';
  final _title = TextEditingController();
  final _address = TextEditingController();
  final _building = TextEditingController();
  final _notes = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text('إضافة عنوان'),
      ),
      body: DarkBackground(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 200,
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Stack(
                  children: [
                    const Center(
                      child: Icon(Icons.map_rounded,
                          color: AppColors.textMuted, size: 80),
                    ),
                    const Center(
                      child: Icon(Icons.location_on,
                          color: AppColors.gold, size: 40),
                    ),
                    Positioned(
                      bottom: 12,
                      right: 12,
                      child: GradientCard(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 8),
                        onTap: () {},
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: const [
                            Icon(Icons.my_location,
                                size: 16, color: AppColors.gold),
                            SizedBox(width: 6),
                            Text('موقعي',
                                style: TextStyle(
                                    color: AppColors.textPrimary,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const Text('نوع العنوان',
                  style: TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700)),
              const SizedBox(height: 10),
              Row(
                children: [
                  _typeTile('home', 'المنزل', Icons.home_rounded),
                  const SizedBox(width: 8),
                  _typeTile('work', 'العمل', Icons.work_outline_rounded),
                  const SizedBox(width: 8),
                  _typeTile('other', 'آخر', Icons.location_on),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _title,
                decoration: const InputDecoration(
                  labelText: 'اسم العنوان (مثل: منزل والدتي)',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _address,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'العنوان التفصيلي',
                  prefixIcon: Icon(Icons.location_on_outlined),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _building,
                decoration: const InputDecoration(
                  labelText: 'رقم المبنى / الشقة',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _notes,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'ملاحظات إضافية (اختياري)',
                ),
              ),
              const SizedBox(height: 30),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('حفظ العنوان'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _typeTile(String id, String label, IconData icon) {
    final selected = _type == id;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _type = id),
        child: Container(
          height: 70,
          decoration: BoxDecoration(
            color: selected
                ? AppColors.gold.withValues(alpha: .12)
                : AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
                color: selected ? AppColors.gold : AppColors.border),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon,
                  color: selected ? AppColors.gold : AppColors.textMuted),
              const SizedBox(height: 4),
              Text(label,
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textPrimary)),
            ],
          ),
        ),
      ),
    );
  }
}
