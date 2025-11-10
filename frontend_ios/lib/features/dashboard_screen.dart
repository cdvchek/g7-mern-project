import 'package:flutter/material.dart';
import 'package:frontend_ios/core/api/api_service.dart';
import 'package:frontend_ios/core/models/envelope.dart';
import 'package:frontend_ios/features/envelope_screens/detail_envelope_page.dart';
import 'package:fl_chart/fl_chart.dart';

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

  int _totalBalance = 10000; // Placeholder total balance
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
      final envelopes = await _apiService.fetchEnvelopes();
      // Uncomment when total balance API is ready
      // final balance = await _apiService.fetchTotalBalance();

      if (mounted) {
        setState(() {
          _envelopes = envelopes;
          // _totalBalance = totalBalance; // Use fetched balance
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

  String _formatCurrency(int amount) {
    return '\$${amount.toStringAsFixed(2)}';
  }

  // This function builds your list of pie chart slices
  List<PieChartSectionData> _buildPieSlices() {
    final List<PieChartSectionData> slices = [];
    
    // Calculate total allocated (now in dollars)
    int totalAllocated = 0;
    for (var envelope in _envelopes) {
      totalAllocated += envelope.amount;
    }
    
    // Calculate leftover amount (now in dollars)
    final int leftoverAmount = _totalBalance - totalAllocated;

    // Create a slice for each envelope
    for (int i = 0; i < _envelopes.length; i++) {
      final envelope = _envelopes[i];
      final isTouched = (i == _touchedIndex);
      final double radius = isTouched ? 60.0 : 50.0;
      // Calculation is the same, but uses the dollar values
      final double percentage = (envelope.amount / _totalBalance) * 100;

      slices.add(
        PieChartSectionData(
          color: envelope.resolvedColor,
          value: envelope.amount.toDouble(), // Value is in dollars
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
      final double percentage = (leftoverAmount / _totalBalance) * 100;

      slices.add(
        PieChartSectionData(
          color: Colors.grey[300],
          value: leftoverAmount.toDouble(), // Value is in dollars
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
          Text(
            '\$10,000.00', // Placeholder as requested
            style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 48),

          // Pie Chart
          SizedBox(
            height: 200,
            child: Stack(
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
                    sections: _buildPieSlices(), // Calls your reworked function
                  ),
                ),
                Text(
                  _getTouchedSliceDetails(), // Calls your reworked function
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 54),

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