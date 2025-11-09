import 'package:flutter/material.dart';
import 'package:frontend_ios/core/api/api_service.dart';
import 'package:frontend_ios/core/models/envelope.dart';
import 'package:frontend_ios/features/envelope_screens/edit_delete_envelope.dart';

class DetailEnvelopePage extends StatefulWidget {
  const DetailEnvelopePage({super.key, required this.envelope});

  final Envelope envelope;

  @override
  State<DetailEnvelopePage> createState() => _DetailEnvelopePageState();
}

class _DetailEnvelopePageState extends State<DetailEnvelopePage> {
  late Envelope _envelope;
  bool _isDeleting = false;
  String? _errorMessage;
  final _apiService = ApiService();
  bool _hasChanges = false;

  static const _mockTransactions = <_EnvelopeTransaction>[
    _EnvelopeTransaction(name: 'Paycheck Deposit', amount: 250, incoming: true),
    _EnvelopeTransaction(name: 'Grocery Run', amount: -120, incoming: false),
    _EnvelopeTransaction(name: 'Farmers Market', amount: -45, incoming: false),
    _EnvelopeTransaction(name: 'Cash Stuffing', amount: 60, incoming: true),
  ];

  @override
  void initState() {
    super.initState();
    _envelope = widget.envelope;
  }

  Future<void> _handleEdit() async {
    final result = await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => EditDeleteEnvelopeScreen(envelope: _envelope),
      ),
    );

    if (result is Map<String, dynamic>) {
      final status = result['status'] as String?;
      if (status == 'updated') {
        final updated = result['envelope'] as Envelope?;
        if (updated != null && mounted) {
          setState(() {
            _envelope = updated;
            _errorMessage = null;
            _hasChanges = true;
          });
        }
      } else if (status == 'deleted') {
        if (mounted) {
          Navigator.of(context).pop({'status': 'deleted', 'id': _envelope.id});
        }
      }
    }
  }

  Future<void> _handleDelete() async {
    final confirm = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Delete Envelope?'),
            content: const Text('This action cannot be undone.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                style: TextButton.styleFrom(foregroundColor: const Color(0xFFB91C1C)),
                child: const Text('Delete'),
              ),
            ],
          ),
        ) ??
        false;

    if (!confirm) return;

    setState(() {
      _isDeleting = true;
      _errorMessage = null;
    });

    try {
      await _apiService.deleteEnvelope(_envelope.id);
      if (mounted) {
        Navigator.of(context).pop({'status': 'deleted', 'id': _envelope.id});
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          final cleaned = e.toString().replaceFirst(RegExp(r'^Exception: ?'), '');
          _errorMessage = cleaned.isEmpty ? 'Unable to delete envelope.' : cleaned;
          _isDeleting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final accent = _resolveColor(_envelope.color);

    return WillPopScope(
      onWillPop: () async {
        _popWithResult();
        return false;
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF7F7FB),
        body: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF1E1F3D)),
                      onPressed: _popWithResult,
                    ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      _envelope.name,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1E1F3D),
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      _envelope.description?.isNotEmpty == true
                          ? _envelope.description!
                          : 'No description provided',
                      style: const TextStyle(color: Color(0xFF7C8097)),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _PrimaryPillButton(label: 'Edit', onPressed: _handleEdit),
                        const SizedBox(width: 16),
                        _PrimaryPillButton(
                          label: 'Delete',
                          onPressed: _isDeleting ? null : _handleDelete,
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: const Color(0xFFE3E6F0)),
                      ),
                      child: Column(
                        children: [
                          Text(
                            _formatCurrency(_envelope.amount),
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1E1F3D),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            height: 8,
                            decoration: BoxDecoration(
                              color: accent.withOpacity(0.25),
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (_errorMessage != null) ...[
                      const SizedBox(height: 20),
                      Text(
                        _errorMessage!,
                        style: const TextStyle(color: Colors.red),
                      ),
                    ],
                    const SizedBox(height: 32),
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Recent Transactions',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1E1F3D),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: const Color(0xFFE3E6F0)),
                      ),
                      child: Column(
                        children: _mockTransactions
                            .map((tx) => _TransactionTile(transaction: tx))
                            .toList(),
                      ),
                    ),
                    const SizedBox(height: 32),
                    const Text(
                      'Transfers will populate here once implemented.',
                      style: TextStyle(color: Color(0xFF7C8097), fontSize: 13),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        ),
      ),
    );
  }

  void _popWithResult() {
    Navigator.of(context).pop(_hasChanges ? {'status': 'updated'} : null);
  }

  Color _resolveColor(String? hex) {
    if (hex == null || hex.isEmpty) {
      return const Color(0xFF1E1F3D);
    }
    final normalized = hex.replaceFirst('#', '');
    if (normalized.length == 6) {
      final value = int.tryParse(normalized, radix: 16);
      if (value != null) {
        return Color(0xFF000000 | value);
      }
    }
    return const Color(0xFF1E1F3D);
  }

  String _formatCurrency(int amount) {
    final buffer = StringBuffer();
    final digits = amount.abs().toString();
    for (int i = 0; i < digits.length; i++) {
      if (i != 0 && (digits.length - i) % 3 == 0) {
        buffer.write(',');
      }
      buffer.write(digits[i]);
    }
    return '\$${amount < 0 ? '-' : ''}$buffer';
  }
}

class _PrimaryPillButton extends StatelessWidget {
  const _PrimaryPillButton({required this.label, required this.onPressed});

  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 120,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF1E1F3D),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: const StadiumBorder(),
        ),
        child: Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

class _EnvelopeTransaction {
  const _EnvelopeTransaction({
    required this.name,
    required this.amount,
    required this.incoming,
  });

  final String name;
  final num amount;
  final bool incoming;
}

class _TransactionTile extends StatelessWidget {
  const _TransactionTile({required this.transaction});

  final _EnvelopeTransaction transaction;

  @override
  Widget build(BuildContext context) {
    final color = transaction.incoming ? const Color(0xFF0F9D58) : const Color(0xFFB91C1C);
    final symbol = transaction.incoming ? '+' : '-';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: Text(
              '${transaction.name} (${transaction.incoming ? '+' : '-'})',
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Text(
            '$symbol \$${transaction.amount.abs().toStringAsFixed(2)}',
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
