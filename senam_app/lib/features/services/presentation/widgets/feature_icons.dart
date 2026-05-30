import 'package:flutter/material.dart';

/// Mirrors `senam_dashboard/src/lib/feature-icons.ts`.
/// The string keys must stay in sync with the dashboard's icon picker so that
/// what the company owner selects renders correctly on the mobile details page.
const Map<String, IconData> kFeatureIcons = {
  'design': Icons.auto_awesome_outlined,
  'warranty': Icons.verified_user_outlined,
  'pricing': Icons.local_offer_outlined,
  'quality': Icons.workspace_premium_outlined,
  'craftsmanship': Icons.handyman_outlined,
  'consultation': Icons.support_agent_outlined,
  'speed': Icons.bolt_outlined,
  'delivery': Icons.local_shipping_outlined,
  'team': Icons.groups_outlined,
  'experience': Icons.star_outline,
  'maintenance': Icons.build_outlined,
  'trust': Icons.handshake_outlined,
  'eco': Icons.eco_outlined,
  'hours': Icons.schedule_outlined,
};

IconData featureIconFor(String? id) =>
    kFeatureIcons[id] ?? Icons.check_circle_outline;
