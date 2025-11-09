import 'package:flutter/material.dart';
import 'package:frontend_ios/core/api/api_service.dart';
import 'package:frontend_ios/core/models/envelope.dart';
import 'package:frontend_ios/features/envelope_screens/create_envelope.dart';

class MainEnvelopeScreen extends StatefulWidget {
  const MainEnvelopeScreen({super.key});

  @override
  State<MainEnvelopeScreen> createState() => _MainEnvelopeScreenState();
}

class _MainEnvelopeScreenState extends State<MainEnvelopeScreen> {
  final _apiService = ApiService();
  List<Envelope> _envelopes = const [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadEnvelopes();
  }

  Future<void> _loadEnvelopes({bool showSpinner = true}) async {
    if (showSpinner) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    }

    try {
      final data = await _apiService.fetchEnvelopes();
      if (!mounted) return;
      setState(() {
        _envelopes = data;
        _isLoading = false;
        _errorMessage = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString().replaceFirst(RegExp(r'^Exception: ?'), '');
      });
    }
  }

  Future<void> _handleCreateTap() async {
    final result = await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const CreateEnvelopeScreen()),
    );

    if (result != null) {
      await _loadEnvelopes();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Envelope created!')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      color: const Color(0xFFF7F7FB),
      child: RefreshIndicator(
        color: const Color(0xFF1E1F3D),
        onRefresh: () => _loadEnvelopes(showSpinner: false),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 48),
          children: [
            _EnvelopeIntro(theme: theme),
            const SizedBox(height: 32),
            Center(
              child: Column(
                children: [
                  _PrimaryActionButton(
                    label: 'Create New Envelope',
                    icon: Icons.add,
                    onPressed: _handleCreateTap,
                  ),
                  const SizedBox(height: 16),
                  _PrimaryActionButton(
                    label: 'Transfer Funds',
                    icon: Icons.sync_alt,
                    onPressed: () {},
                    width: 180,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            if (_errorMessage != null)
              _ErrorBanner(
                message: _errorMessage!,
                onRetry: _loadEnvelopes,
              ),
            if (_isLoading)
              ...List.generate(2, (_) => const _EnvelopeSkeleton()),
            if (!_isLoading && _envelopes.isEmpty && _errorMessage == null)
              _EmptyState(onCreateTap: _handleCreateTap),
            if (!_isLoading && _envelopes.isNotEmpty)
              ..._envelopes.map((envelope) => _EnvelopeCard(envelope: envelope)),
          ],
        ),
      ),
    );
  }
}

class _EnvelopeIntro extends StatelessWidget {
  const _EnvelopeIntro({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        'Your Envelopes',
        style: theme.textTheme.headlineSmall?.copyWith(
          fontWeight: FontWeight.w600,
          color: const Color(0xFF1E1F3D),
        ),
      ),
    );
  }
}

class _PrimaryActionButton extends StatelessWidget {
  const _PrimaryActionButton({
    required this.label,
    required this.icon,
    required this.onPressed,
    this.width = 240,
  });

  final String label;
  final IconData icon;
  final VoidCallback onPressed;
  final double width;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      child: ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF1E1F3D),
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          shape: const StadiumBorder(),
          elevation: 4,
        ),
        onPressed: onPressed,
        icon: Icon(icon, size: 18, color: Colors.white),
        label: Text(
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

class _EnvelopeCard extends StatelessWidget {
  const _EnvelopeCard({required this.envelope});

  final Envelope envelope;

  Color get _badgeColor {
    final raw = envelope.color;
    if (raw == null || raw.isEmpty) {
      return const Color(0xFF1E1F3D);
    }
    final normalized = raw.replaceFirst('#', '');
    if (normalized.length == 6) {
      final value = int.tryParse(normalized, radix: 16);
      if (value != null) {
        return Color(0xFF000000 | value);
      }
    }
    return const Color(0xFF1E1F3D);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE3E6F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x11000000),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      envelope.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1E1F3D),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      envelope.amount > 0
                          ? 'Goal: \$${envelope.amount}'
                          : 'Goal not set',
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF7C8097),
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () {},
                icon: const Icon(Icons.more_horiz, color: Color(0xFF1E1F3D)),
                tooltip: 'Envelope actions',
              ),
            ],
          ),
          const SizedBox(height: 16),
          _EnvelopeSketch(accentColor: _badgeColor),
        ],
      ),
    );
  }
}

class _EnvelopeSketch extends StatelessWidget {
  const _EnvelopeSketch({required this.accentColor});

  final Color accentColor;

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: CustomPaint(
        painter: _EnvelopeSketchPainter(accentColor),
      ),
    );
  }
}

class _EnvelopeSketchPainter extends CustomPainter {
  _EnvelopeSketchPainter(this.strokeColor);

  final Color strokeColor;

  @override
  void paint(Canvas canvas, Size size) {
    final outlinePaint = Paint()
      ..color = strokeColor.withOpacity(0.25)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    final linePaint = Paint()
      ..color = strokeColor.withOpacity(0.4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    final rect = RRect.fromLTRBR(0, 0, size.width, size.height, const Radius.circular(18));
    canvas.drawRRect(rect, outlinePaint);
    canvas.drawLine(const Offset(0, 0), Offset(size.width, size.height), linePaint);
    canvas.drawLine(Offset(0, size.height), Offset(size.width, 0), linePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _EnvelopeSkeleton extends StatelessWidget {
  const _EnvelopeSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE3E6F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 16,
            width: 140,
            decoration: BoxDecoration(
              color: const Color(0xFFE6E9F5),
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          const SizedBox(height: 12),
          Container(
            height: 120,
            decoration: BoxDecoration(
              color: const Color(0xFFF0F2FB),
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFE4E4),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: Color(0xFF9E1D1D)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: Color(0xFF9E1D1D)),
            ),
          ),
          TextButton(
            onPressed: onRetry,
            child: const Text('Retry'),
          )
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onCreateTap});

  final VoidCallback onCreateTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 32),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE3E6F0)),
      ),
      child: Column(
        children: [
          const Text(
            'No envelopes yet',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1E1F3D),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Start by creating your first envelope to organize funds.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF7C8097)),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: onCreateTap,
            child: const Text('Create one now'),
          ),
        ],
      ),
    );
  }
}
