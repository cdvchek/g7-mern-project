import 'package:flutter/material.dart';
import 'package:frontend_ios/core/api/api_service.dart';
import 'package:frontend_ios/core/models/envelope.dart';
import 'package:frontend_ios/features/envelope_screens/detail_envelope_page.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  String? _errorMessage;
  List<Envelope> _envelopes = [];

  @override
  void initState() {
    super.initState();
    _loadEnvelopes();
  }

  Future<void> _loadEnvelopes() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final envelopes = await _apiService.fetchEnvelopes();
      if (mounted) {
        setState(() {
          _envelopes = envelopes;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  // Handles navigation to the detail page and catches the result
  void _navigateToEnvelopeDetail(Envelope envelope) async {
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (_) => DetailEnvelopePage(envelope: envelope),
      ),
    );

    if (result != null && mounted) {
      final status = result['status'] as String?;
      if (status == 'updated') {
        _loadEnvelopes(); // Reload all data
      } else if (status == 'deleted') {
        // Remove from the list without a full reload
        final id = result['id'] as String?;
        setState(() {
          _envelopes.removeWhere((e) => e.id == id);
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _loadEnvelopes, // Allows pull-to-refresh
      child: ListView(
        padding: const EdgeInsets.all(20.0),
        children: [
          // 1. Total Balance Placeholder
          Text(
            'Total Balance:',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          Text(
            '\$10,000.00', // Placeholder as requested
            style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 24),

          // 2. Pie Chart Placeholder
          Center(
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                color: Colors.grey[200],
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  'Pie Chart Placeholder',
                  style: TextStyle(color: Colors.grey[600]),
                ),
              ),
            ),
          ),
          const SizedBox(height: 32),

          // 3. Envelopes Section
          Text(
            'Envelopes at a Glance',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          _buildEnvelopeSection(),
        ],
      ),
    );
  }

  // This widget decides whether to show loading, error, or the grid
  Widget _buildEnvelopeSection() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Text(
          _errorMessage!,
          style: const TextStyle(color: Colors.red),
          textAlign: TextAlign.center,
        ),
      );
    }

    if (_envelopes.isEmpty) {
      return const Center(child: Text('You have no envelopes yet.'));
    }

    // A scrollable 2-column grid
    return GridView.builder(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        childAspectRatio: 1.2,
      ),
      itemCount: _envelopes.length,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemBuilder: (context, index) {
        final envelope = _envelopes[index];
        return _EnvelopeCard(
          envelope: envelope,
          onTap: () => _navigateToEnvelopeDetail(envelope),
        );
      },
    );
  }
}

// A simple card widget for the grid
class _EnvelopeCard extends StatelessWidget {
  const _EnvelopeCard({
    required this.envelope,
    required this.onTap,
  });

  final Envelope envelope;
  final VoidCallback onTap;

  String _formatCurrency(int amount) {
    return '\$${amount.toStringAsFixed(2)}';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // This CircleAvatar uses the resolvedColor helper
              CircleAvatar(
                radius: 16,
                backgroundColor: envelope.resolvedColor,
              ),
              const Spacer(),
              Text(
                envelope.name,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Text(
                _formatCurrency(envelope.amount),
                style: TextStyle(
                  color: Colors.grey[700],
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}