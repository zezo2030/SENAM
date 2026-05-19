import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:senam_app/app/main_nav.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../domain/entities/order.dart';
import '../cubit/rating_cubit.dart';

class RatingPage extends StatelessWidget {
  final OrderEntity order;
  const RatingPage({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<RatingCubit>(),
      child: _RatingView(order: order),
    );
  }
}

class _RatingView extends StatefulWidget {
  final OrderEntity order;
  const _RatingView({required this.order});

  @override
  State<_RatingView> createState() => _RatingViewState();
}

class _RatingViewState extends State<_RatingView> {
  int _companyStars = 5;
  int _techStars = 5;
  final _commentController = TextEditingController();

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  void _submit(BuildContext context) {
    context.read<RatingCubit>().submit(
          orderNumber: widget.order.number,
          companyStars: _companyStars,
          techStars: _techStars,
          comment: _commentController.text.trim(),
        );
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<RatingCubit, RatingState>(
      listener: (context, state) {
        if (state.status == RatingStatus.success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('شكراً لتقييمك!'),
              backgroundColor: AppColors.success,
            ),
          );
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (_) => const MainNav()),
            (route) => false,
          );
        } else if (state.status == RatingStatus.failure) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.errorMessage ?? 'تعذّر إرسال التقييم'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      },
      builder: (context, state) {
        final loading = state.status == RatingStatus.loading;
        return Scaffold(
          appBar: AppBar(title: const Text('تقييم الخدمة')),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const SizedBox(height: 10),
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 70,
                      height: 70,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color:
                            AppColors.success.withValues(alpha: 0.15),
                      ),
                      child: const Icon(Icons.check_circle,
                          color: AppColors.success, size: 40),
                    ),
                    const SizedBox(height: 12),
                    const Text('تم اكتمال الخدمة',
                        style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary)),
                    const SizedBox(height: 4),
                    const Text('كيف كانت تجربتك؟',
                        style: TextStyle(
                            fontSize: 13,
                            color: AppColors.textSecondary)),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              _ratingBlock(
                title: 'تقييم الشركة',
                subtitle: widget.order.companyName,
                value: _companyStars,
                onChanged: (v) => setState(() => _companyStars = v),
              ),
              const SizedBox(height: 14),
              _ratingBlock(
                title: 'تقييم الفني',
                subtitle: 'أحمد محمد',
                value: _techStars,
                onChanged: (v) => setState(() => _techStars = v),
              ),
              const SizedBox(height: 14),
              GradientCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('أضف تعليقاً',
                        style: TextStyle(
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary)),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _commentController,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        hintText: 'شاركنا رأيك في الخدمة...',
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _attachBox(),
                        const SizedBox(width: 10),
                        _attachBox(),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: loading ? null : () => _submit(context),
                child: loading
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                            strokeWidth: 2.4,
                            color: Color(0xFF1A1500)),
                      )
                    : const Text('إرسال التقييم'),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _ratingBlock({
    required String title,
    required String subtitle,
    required int value,
    required ValueChanged<int> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Text(title,
              style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                  color: AppColors.textPrimary)),
          const SizedBox(height: 2),
          Text(subtitle,
              style: const TextStyle(
                  fontSize: 12, color: AppColors.textMuted)),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (i) {
              return GestureDetector(
                onTap: () => onChanged(i + 1),
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 4),
                  child: Icon(
                    Icons.star_rounded,
                    size: 38,
                    color: i < value
                        ? AppColors.gold
                        : AppColors.border,
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _attachBox() {
    return Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: const Icon(Icons.add_a_photo_outlined,
          color: AppColors.textMuted, size: 22),
    );
  }
}
