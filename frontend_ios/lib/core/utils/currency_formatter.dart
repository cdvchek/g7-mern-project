// In lib/core/utils/currency_formatter.dart
import 'package:intl/intl.dart';

String formatCurrency(int amountInCents, String currencyCode) {
  final double amountInDollars = amountInCents / 100.0;

  // 1. ALWAYS use 'en_US' for the formatting (e.g., 1,234.56)
  final String locale = 'en_US'; 

  final formatter = NumberFormat.currency(
    locale: locale,
    name: currencyCode, // 2. Let the currency code ("USD", "EUR", "JPY") change
  );

  return formatter.format(amountInDollars);
}