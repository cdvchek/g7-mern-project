import 'package:flutter/material.dart';
import 'package:frontend_ios/core/api/api_service.dart';
import 'package:frontend_ios/core/models/envelope.dart';
import 'package:frontend_ios/core/models/transaction.dart';
import 'package:frontend_ios/features/envelope_screens/detail_envelope_page.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';

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

  int _totalBalance = 0; // Placeholder total balance
  int _availableToDeallocateCents = 0; 
  int _touchedIndex = -1; // For pie chart interaction 

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Fetch both envelopes and transactions
      final results = await Future.wait([
        _apiService.fetchEnvelopes(),
        _apiService.fetchTransactions(), // <-- Fetch all transactions
      ]);
      
      final envelopes = results[0] as List<Envelope>;
      final transactions = results[1] as List<Transaction>;

      // Calculate total allocated (money in envelopes)
      int totalAllocatedCents = 0;
      for (final env in envelopes) {
        totalAllocatedCents += env.amount;
      }

      // Calculate unallocated totals
      int availableCents = 0;
      int deallocateCents = 0;

      // Calculate total unallocated (money in transactions)
      for (final tx in transactions) {
        final unallocated = tx.unallocatedCents;
        if (unallocated > 0) {
          availableCents += unallocated;
        } else if (unallocated < 0) {
          deallocateCents += unallocated;
        }
      }
      
      // The *true* total balance
      // final totalBalance = totalAllocatedCents + totalUnallocatedCents;

      int availableToAllocateCents = 0;
      for (final tx in transactions) {
        final unallocated = tx.unallocatedCents;
        if (unallocated > 0) { // <-- This is the new condition
          availableToAllocateCents += unallocated;
        }
      }
      
      // New total balance calculation (doesn't include the amount to be deallocated)
      final totalBalance = totalAllocatedCents + availableToAllocateCents;

      if (mounted) {
        setState(() {
          _envelopes = envelopes;
          _totalBalance = totalBalance; // Use fetched balance
          _availableToDeallocateCents = deallocateCents; 
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

  Future<void> _loadEnvelopes() async {
    await _loadDashboardData();
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
      if (status == 'updated' || status == 'deleted') {
        _loadDashboardData(); // Reload all data
      }
    }
  }

  String _formatCurrency(int amountInCents) {
    // Convert cents (int) to dollars (double)
    final double amountInDollars = amountInCents / 100.0;

    // Create a formatter that handles commas and $
    final formatter = NumberFormat.currency(
      locale: 'en_US', // This gives you 1,000.00
      symbol: '\$',
      decimalDigits: 2,
    );
    return formatter.format(amountInDollars);
  }

  // This function builds your list of pie chart slices
  List<PieChartSectionData> _buildPieSlices() {
    final List<PieChartSectionData> slices = [];
    
    // Calculate total allocated (now in dollars)
    int totalAllocated = 0;
    for (var envelope in _envelopes) {
      totalAllocated += envelope.amount;    // in cents
    }
    
    // Calculate leftover amount (now in dollars)
    final int leftoverAmount = _totalBalance - totalAllocated;

    // Create a slice for each envelope
    for (int i = 0; i < _envelopes.length; i++) {
      final envelope = _envelopes[i];
      final isTouched = (i == _touchedIndex);
      final double radius = isTouched ? 60.0 : 50.0;

      final double percentage = (_totalBalance > 0)
          ? (envelope.amount / _totalBalance) * 100
          : 0.0;

      slices.add(
        PieChartSectionData(
          color: envelope.resolvedColor,
          value: envelope.amount.toDouble(), // Value is in cents
          title: '${percentage.toStringAsFixed(1)}%',
          radius: radius,
          titleStyle: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      );
    }

    // Add the "Leftover" slice
    if (leftoverAmount > 0) {
      final isTouched = (_envelopes.length == _touchedIndex);
      final double radius = isTouched ? 60.0 : 50.0;
      final double percentage = (_totalBalance > 0)
          ? (leftoverAmount / _totalBalance) * 100
          : 0.0;

      slices.add(
        PieChartSectionData(
          color: Colors.grey[300],
          value: leftoverAmount.toDouble(), // Value is in cents
          title: '${percentage.toStringAsFixed(1)}%',
          radius: radius,
          titleStyle: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: Colors.grey[700],
          ),
        ),
      );
    }
    return slices;
  }

  // Shows the details in the center
  String _getTouchedSliceDetails() {
    if (_touchedIndex < 0) {
      // Show total when nothing is touched
      return _formatCurrency(_totalBalance);
    }
    
    if (_touchedIndex < _envelopes.length) {
      // Show envelope details
      final envelope = _envelopes[_touchedIndex];
      return '${envelope.name}: \n${_formatCurrency(envelope.amount)}';
    } else {
      // Show "Leftover" details
      final int leftoverAmount = _totalBalance - _envelopes.fold(0, (sum, e) => sum + e.amount);
      return 'Unallocated: \n${_formatCurrency(leftoverAmount)}';
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _loadEnvelopes, // Allows pull-to-refresh
      child: ListView(
        padding: const EdgeInsets.all(20.0),
        children: [
          // Total Balance Placeholder
          Text(
            'Total Balance:',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          _isLoading
            ? Text(
                'Loading...',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.grey,
                    ),
              )
            : Text(
                _formatCurrency(_totalBalance),
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),

          const SizedBox(height: 16),

          // Pie Chart Section
          Text(
            'Your Money\'s Distribution',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 48),
          _buildPieChartSection(),
          const SizedBox(height: 10),
          if (!_isLoading && _availableToDeallocateCents < 0)
            Padding(
              // Add some space above it, but less than the next section
              padding: const EdgeInsets.only(top: 32.0), 
              child: Center(
                child: Column(
                  children: [
                    Text(
                      'Needs De-allocation:',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.red[700],
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      _formatCurrency(_availableToDeallocateCents),
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.red[700],
                            fontSize: 16,
                          ),
                    ),
                  ],
                ),
              ),
            ),

          const SizedBox(height: 32),

          // Envelopes Section
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

  Widget _buildPieChartSection() {
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

    if (_totalBalance == 0) {
      return const Center(child: Text("You have currently have no money in your envelopes. \n\nConnect a bank account from within the Accounts page.", textAlign: TextAlign.center,));
    }

    return SizedBox(
      height: 200,
      child: _isLoading
        ? const Center(child: CircularProgressIndicator())
        : Stack(
            alignment: Alignment.center,
            children: [
              PieChart(
                PieChartData(
                  pieTouchData: PieTouchData(
                    touchCallback: (FlTouchEvent event, pieTouchResponse) {
                      setState(() {
                        if (!event.isInterestedForInteractions ||
                            pieTouchResponse == null ||
                            pieTouchResponse.touchedSection == null) {
                          _touchedIndex = -1;
                          return;
                        }
                        _touchedIndex = pieTouchResponse.touchedSection!.touchedSectionIndex;
                      });
                    },
                  ),
                  borderData: FlBorderData(show: false),
                  sectionsSpace: 2,
                  centerSpaceRadius: 80,
                  sections: _buildPieSlices(),
                ),
              ),
              Text(
                _getTouchedSliceDetails(),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
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

  String _formatCurrency(int amountInCents) {
    final double amountInDollars = amountInCents / 100.0;

    final formatter = NumberFormat.currency(
      locale: 'en_US',
      symbol: '\$',
      decimalDigits: 2,
    );
    return formatter.format(amountInDollars);
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