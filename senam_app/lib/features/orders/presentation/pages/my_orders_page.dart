import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/di/injection_container.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../cubit/orders_cubit.dart';
import '../widgets/order_card.dart';
import 'order_tracking_page.dart';

class MyOrdersPage extends StatelessWidget {
  const MyOrdersPage({super.key});

  static const _tabs = ['الكل', 'الحالية', 'المكتملة', 'الملغية'];

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<OrdersCubit>()..load(null),
      child: Scaffold(
        appBar: AppBar(
          automaticallyImplyLeading: false,
          title: const Text('طلباتي'),
        ),
        body: BlocBuilder<OrdersCubit, OrdersState>(
          builder: (context, state) {
            return Column(
              children: [
                SizedBox(
                  height: 44,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _tabs.length,
                    separatorBuilder: (_, i) => const SizedBox(width: 8),
                    itemBuilder: (_, i) {
                      final selected = i == state.tabIndex;
                      return GestureDetector(
                        onTap: () =>
                            context.read<OrdersCubit>().setTab(i),
                        child: Container(
                          padding:
                              const EdgeInsets.symmetric(horizontal: 18),
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: selected
                                ? AppColors.gold
                                : AppColors.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                                color: selected
                                    ? AppColors.gold
                                    : AppColors.border),
                          ),
                          child: Text(_tabs[i],
                              style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: selected
                                      ? const Color(0xFF1A1500)
                                      : AppColors.textSecondary)),
                        ),
                      );
                    },
                  ),
                ),
                Expanded(child: _body(context, state)),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _body(BuildContext context, OrdersState state) {
    if (state.status == OrdersStatus.loading ||
        state.status == OrdersStatus.initial) {
      return const LoadingView();
    }
    if (state.status == OrdersStatus.failure) {
      return ErrorView(
        message: state.errorMessage ?? 'تعذّر تحميل الطلبات',
        onRetry: () => context
            .read<OrdersCubit>()
            .setTab(state.tabIndex),
      );
    }
    if (state.orders.isEmpty) {
      return const EmptyView(
        message: 'لا توجد طلبات هنا',
        icon: Icons.receipt_long_outlined,
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: state.orders.length,
      separatorBuilder: (_, i) => const SizedBox(height: 12),
      itemBuilder: (_, i) {
        final order = state.orders[i];
        return OrderCard(
          order: order,
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => OrderTrackingPage(order: order),
            ),
          ),
        );
      },
    );
  }
}
