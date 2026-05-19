import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../../services/domain/entities/company.dart';
import '../../../services/domain/entities/company_service.dart';
import '../../domain/entities/booking.dart';
import '../cubit/booking_cubit.dart';
import 'order_success_page.dart';

class BookingPage extends StatelessWidget {
  final Company company;
  const BookingPage({super.key, required this.company});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<BookingCubit>(),
      child: _BookingView(company: company),
    );
  }
}

class _BookingView extends StatefulWidget {
  final Company company;
  const _BookingView({required this.company});

  @override
  State<_BookingView> createState() => _BookingViewState();
}

class _BookingViewState extends State<_BookingView> {
  int _serviceIndex = 0;
  int _selectedDay = 25;
  int _timeIndex = 1;
  int _paymentIndex = 0;
  final _notesController = TextEditingController();

  static const _timeSlots = [
    '09:00 ص',
    '10:00 ص',
    '11:00 ص',
    '01:00 م',
    '03:00 م',
    '05:00 م',
  ];

  static const _payments = [
    (Icons.money, 'الدفع نقداً عند الوصول'),
    (Icons.credit_card, 'بطاقة ائتمان / مدى'),
    (Icons.phone_iphone, 'Apple Pay'),
  ];

  CompanyService get _service => widget.company.services[_serviceIndex];
  int get _serviceFee => 10;
  int get _total => _service.price + _serviceFee;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  void _confirm(BuildContext context) {
    final booking = Booking(
      companyId: widget.company.id,
      companyName: widget.company.name,
      companyLogoLabel: widget.company.logoLabel,
      serviceName: _service.name,
      price: _service.price,
      serviceFee: _serviceFee,
      date: '$_selectedDay مايو 2026',
      time: _timeSlots[_timeIndex],
      address: 'الدوحة، اللؤلؤة، برج 25، شقة 12',
      notes: _notesController.text.trim(),
      paymentMethod: _payments[_paymentIndex].$2,
    );
    context.read<BookingCubit>().submit(booking);
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<BookingCubit, BookingState>(
      listener: (context, state) {
        if (state.status == BookingStatus.success) {
          final booking = Booking(
            companyId: widget.company.id,
            companyName: widget.company.name,
            companyLogoLabel: widget.company.logoLabel,
            serviceName: _service.name,
            price: _service.price,
            serviceFee: _serviceFee,
            date: '$_selectedDay مايو 2026',
            time: _timeSlots[_timeIndex],
            address: 'الدوحة، اللؤلؤة، برج 25، شقة 12',
            notes: _notesController.text.trim(),
            paymentMethod: _payments[_paymentIndex].$2,
          );
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => OrderSuccessPage(
                booking: booking,
                orderNumber: state.orderNumber ?? '',
              ),
            ),
          );
        } else if (state.status == BookingStatus.failure) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.errorMessage ?? 'حدث خطأ ما'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      },
      builder: (context, state) {
        final loading = state.status == BookingStatus.loading;
        return Scaffold(
          appBar: AppBar(
            title: const Text(
              'تأكيد الطلب',
              style: TextStyle(
                fontFamily: 'ElMessiri',
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimary,
              ),
            ),
            backgroundColor: Colors.transparent,
            elevation: 0,
            centerTitle: true,
          ),
          extendBodyBehindAppBar: true,
          body: DarkBackground(
            child: SafeArea(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                children: [
                  _companyHeader(),
                  const SizedBox(height: 20),
                  _sectionTitle('نوع الخدمة'),
                  const SizedBox(height: 10),
                  ...List.generate(widget.company.services.length, (i) {
                    final s = widget.company.services[i];
                    return _selectableTile(
                      selected: i == _serviceIndex,
                      onTap: () => setState(() => _serviceIndex = i),
                      title: s.name,
                      subtitle: 'المدة: ${s.duration}',
                      trailing: '${s.price} ر.ق',
                    );
                  }),
                  const SizedBox(height: 20),
                  _sectionTitle('اختر التاريخ'),
                  const SizedBox(height: 10),
                  _calendar(),
                  const SizedBox(height: 20),
                  _sectionTitle('اختر الوقت'),
                  const SizedBox(height: 10),
                  _timeGrid(),
                  const SizedBox(height: 20),
                  _sectionTitle('الموقع'),
                  const SizedBox(height: 10),
                  _locationCard(),
                  const SizedBox(height: 20),
                  _sectionTitle('ملاحظات (اختياري)'),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _notesController,
                    maxLines: 3,
                    style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontFamily: 'ElMessiri'),
                    decoration: InputDecoration(
                      hintText: 'أضف أي ملاحظات للشركة...',
                      hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 13, fontFamily: 'ElMessiri'),
                      filled: true,
                      fillColor: AppColors.surface,
                      contentPadding: const EdgeInsets.all(16),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(color: AppColors.border),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(color: AppColors.border),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(color: AppColors.gold, width: 1.5),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  _sectionTitle('طريقة الدفع'),
                  const SizedBox(height: 10),
                  ...List.generate(_payments.length, (i) {
                    return _selectableTile(
                      selected: i == _paymentIndex,
                      onTap: () => setState(() => _paymentIndex = i),
                      leadingIcon: _payments[i].$1,
                      title: _payments[i].$2,
                    );
                  }),
                  const SizedBox(height: 20),
                  _couponField(),
                  const SizedBox(height: 20),
                  _summary(),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
          bottomNavigationBar: _confirmBar(context, loading),
        );
      },
    );
  }

  Widget _companyHeader() {
    final c = widget.company;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        textDirection: TextDirection.rtl,
        children: [
          CompanyLogo(label: c.logoLabel, color: c.logoColor, size: 52),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  c.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                    color: AppColors.textPrimary,
                    fontFamily: 'ElMessiri',
                  ),
                ),
                const SizedBox(height: 6),
                RatingBadge(rating: c.rating, count: c.reviewsCount, iconSize: 16),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String t) => Padding(
        padding: const EdgeInsets.only(top: 8, bottom: 4),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.start,
          textDirection: TextDirection.rtl,
          children: [
            const Icon(Icons.diamond, color: AppColors.gold, size: 10),
            const SizedBox(width: 8),
            Text(
              t,
              style: const TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 16,
                color: AppColors.textPrimary,
                fontFamily: 'ElMessiri',
              ),
            ),
          ],
        ),
      );

  Widget _selectableTile({
    required bool selected,
    required VoidCallback onTap,
    required String title,
    String? subtitle,
    String? trailing,
    IconData? leadingIcon,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected 
              ? AppColors.gold.withValues(alpha: 0.04) 
              : AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
              color: selected ? AppColors.gold : AppColors.border,
              width: selected ? 1.5 : 1),
          boxShadow: selected ? [
            BoxShadow(
              color: AppColors.gold.withValues(alpha: 0.06),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ] : null,
        ),
        child: Row(
          textDirection: TextDirection.rtl,
          children: [
            Icon(
              selected
                  ? Icons.radio_button_checked
                  : Icons.radio_button_off,
              color: selected ? AppColors.gold : AppColors.textMuted,
              size: 20,
            ),
            const SizedBox(width: 12),
            if (leadingIcon != null) ...[
              Icon(leadingIcon, color: AppColors.gold, size: 20),
              const SizedBox(width: 10),
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 14,
                      color: AppColors.textPrimary,
                      fontFamily: 'ElMessiri',
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textMuted,
                        fontFamily: 'ElMessiri',
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (trailing != null) ...[
              const SizedBox(width: 12),
              Text(
                trailing,
                style: const TextStyle(
                  color: AppColors.gold,
                  fontWeight: FontWeight.w900,
                  fontSize: 15,
                  fontFamily: 'ElMessiri',
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _calendar() {
    const weekDays = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            textDirection: TextDirection.rtl,
            children: [
              const Icon(Icons.chevron_right, color: AppColors.gold, size: 22),
              Text(
                'مايو 2026',
                style: const TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 15,
                  color: AppColors.gold,
                  fontFamily: 'ElMessiri',
                ),
              ),
              const Icon(Icons.chevron_left, color: AppColors.gold, size: 22),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            textDirection: TextDirection.rtl,
            children: weekDays
                .map((d) => Expanded(
                      child: Text(
                        d,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textMuted,
                          fontFamily: 'ElMessiri',
                        ),
                      ),
                    ))
                .toList(),
          ),
          const SizedBox(height: 8),
          GridView.count(
            crossAxisCount: 7,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 6,
            crossAxisSpacing: 6,
            children: List.generate(31, (i) {
              final day = i + 1;
              final selected = day == _selectedDay;
              final past = day < 19;
              return GestureDetector(
                onTap: past ? null : () => setState(() => _selectedDay = day),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    gradient: selected ? AppColors.goldGradient : null,
                    color: selected ? null : (past ? Colors.transparent : AppColors.surface),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: selected 
                          ? Colors.transparent 
                          : (past ? Colors.transparent : AppColors.border.withValues(alpha: 0.5)),
                      width: 1,
                    ),
                    boxShadow: selected ? [
                      BoxShadow(
                        color: AppColors.gold.withValues(alpha: 0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      )
                    ] : null,
                  ),
                  child: Text(
                    '$day',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: selected ? FontWeight.w900 : FontWeight.w700,
                      fontFamily: 'ElMessiri',
                      color: selected
                          ? const Color(0xFF1A1500)
                          : past
                              ? AppColors.textMuted
                              : AppColors.textPrimary,
                    ),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _timeGrid() {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      textDirection: TextDirection.rtl,
      children: List.generate(_timeSlots.length, (i) {
        final selected = i == _timeIndex;
        return GestureDetector(
          onTap: () => setState(() => _timeIndex = i),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
            decoration: BoxDecoration(
              gradient: selected ? AppColors.goldGradient : null,
              color: selected ? null : AppColors.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                  color: selected ? Colors.transparent : AppColors.border),
              boxShadow: selected ? [
                BoxShadow(
                  color: AppColors.gold.withValues(alpha: 0.25),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                )
              ] : null,
            ),
            child: Text(
              _timeSlots[i],
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w900,
                fontFamily: 'ElMessiri',
                color: selected
                    ? const Color(0xFF1A1500)
                    : AppColors.textSecondary,
              ),
            ),
          ),
        );
      }),
    );
  }

  Widget _locationCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        textDirection: TextDirection.rtl,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.gold.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.location_on, color: AppColors.gold, size: 22),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  'المنزل',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                    color: AppColors.textPrimary,
                    fontFamily: 'ElMessiri',
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'الدوحة، اللؤلؤة، برج 25، شقة 12',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textMuted,
                    fontFamily: 'ElMessiri',
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () {},
            child: const Text(
              'تغيير',
              style: TextStyle(
                color: AppColors.gold,
                fontWeight: FontWeight.w900,
                fontFamily: 'ElMessiri',
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _couponField() {
    return Container(
      padding: const EdgeInsets.only(right: 14, left: 6, top: 4, bottom: 4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        textDirection: TextDirection.rtl,
        children: [
          const Icon(Icons.local_offer_outlined,
              color: AppColors.gold, size: 20),
          const SizedBox(width: 10),
          const Expanded(
            child: TextField(
              style: TextStyle(color: AppColors.textPrimary, fontSize: 13, fontFamily: 'ElMessiri'),
              textDirection: TextDirection.rtl,
              decoration: InputDecoration(
                hintText: 'أدخل كود الخصم',
                hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 13, fontFamily: 'ElMessiri'),
                filled: false,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(vertical: 10),
              ),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              gradient: AppColors.goldGradient,
              borderRadius: BorderRadius.circular(12),
            ),
            child: ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text(
                'تطبيق',
                style: TextStyle(
                  color: Color(0xFF1A1500),
                  fontWeight: FontWeight.w900,
                  fontSize: 12,
                  fontFamily: 'ElMessiri',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _summary() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          _summaryRow('السعر الأساسي', '${_service.price} ر.ق'),
          const SizedBox(height: 10),
          _summaryRow('رسوم الخدمة', '$_serviceFee ر.ق'),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(color: AppColors.border, height: 1),
          ),
          _summaryRow('الإجمالي', '$_total ر.ق', bold: true),
        ],
      ),
    );
  }

  Widget _summaryRow(String label, String value, {bool bold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      textDirection: TextDirection.rtl,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: bold ? 15 : 13,
            fontWeight: bold ? FontWeight.w900 : FontWeight.w700,
            fontFamily: 'ElMessiri',
            color: bold
                ? AppColors.textPrimary
                : AppColors.textSecondary,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: bold ? 17 : 14,
            fontWeight: FontWeight.w900,
            fontFamily: 'ElMessiri',
            color: bold ? AppColors.gold : AppColors.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _confirmBar(BuildContext context, bool loading) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          textDirection: TextDirection.rtl,
          children: [
            Expanded(
              child: Container(
                height: 48,
                decoration: BoxDecoration(
                  gradient: AppColors.goldGradient,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.gold.withValues(alpha: 0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    )
                  ],
                ),
                child: ElevatedButton(
                  onPressed: loading ? null : () => _confirm(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: loading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                              strokeWidth: 2.4, color: Color(0xFF1A1500)),
                        )
                      : const Text(
                          'تأكيد الطلب',
                          style: TextStyle(
                            color: Color(0xFF1A1500),
                            fontWeight: FontWeight.w900,
                            fontSize: 15,
                            fontFamily: 'ElMessiri',
                          ),
                        ),
                ),
              ),
            ),
            const SizedBox(width: 20),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'الإجمالي',
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.textMuted,
                    fontFamily: 'ElMessiri',
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '$_total ر.ق',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: AppColors.gold,
                    fontFamily: 'ElMessiri',
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
