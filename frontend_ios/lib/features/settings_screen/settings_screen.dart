import 'package:flutter/material.dart';
import 'package:frontend_ios/core/api/api_service.dart';
import 'package:timezone_dropdown_plus/timezone_dropdown_plus.dart';
import 'package:currency_picker/currency_picker.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final apiService = ApiService();
  final passwordController = TextEditingController();
  bool isLoading = true;
  String? errorMessage;   // General error message
  String? fieldErrorMessage; // Error for individual fields

  String? currentlyEditingField; 
  String? selectedTimezone;
  String? selectedCurrency;

  // Controllers to hold the form values
  late final TextEditingController nameController;
  late final TextEditingController emailController;
  late String originalValue;
  late bool isEmailVerified;

  // Selected values for dropdowns
  // String? selectedCurrency;

  @override
  void initState() {
    super.initState();
    nameController = TextEditingController();
    emailController = TextEditingController();

    // Run load user data after the first build is complete
    WidgetsBinding.instance.addPostFrameCallback((_) {
      loadUserData();
    });
  }

  @override
  void dispose() {
    nameController.dispose();
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  Future<void> loadUserData() async {
    if (!isLoading) {
      setState(() { isLoading = true; });
    }

    final user = await apiService.getUser();

    if (user != null && mounted) {
      // Fill form with user's data from the DB
      setState(() {
        nameController.text = user.name ?? "No name";
        emailController.text = user.email;
        isEmailVerified = user.isEmailVerified;
        selectedTimezone = user.timezone;
        selectedCurrency = user.currency;
        isLoading = false;
      });
    } else {
      if (mounted) {
        setState(() {
          errorMessage = "Failed to load user data.";
          isLoading = false;
        });
      }
    }
  }

  Future<String?> handleSave(String field) async {
    // Show password dialog
    final password = await showPasswordDialog();
    if (password == null || password.isEmpty) {
      return "Password is required to save changes.";
    }

    setState(() { isLoading = true; fieldErrorMessage = null; });

    // Build the arguments for the API call based on the fieldKey
    String? result;
    if (field == "name") {
      result = await apiService.updateUser(
        name: nameController.text,
        password: password,
      );
    } 
    else if (field == "email") {
      result = await apiService.updateUser(
        email: emailController.text,
        password: password,
      );
      if (result == "success") {
        // Show dialog about email verification
        await showDialog(
          context: context,
          builder: (context) =>
          AlertDialog(
            title: Text('Reverify your email'),
            content: Text('A verification email has been sent to your new email address. Please verify to complete the change.'),
            actions: [
              TextButton(
                child: Text('Confirm'),
                onPressed: () {
                  Navigator.pop(context);
                },
              ),
            ],
          )
        );
      }
    }
    else if (field == "timezone") {
      result = await apiService.updateUser(
        timezone: selectedTimezone,
        password: password,
      );
    } else if (field == "currency") {
        result = await apiService.updateUser(
          currency: selectedCurrency,
          password: password,
      );
    }

    if (result == "success") {
      // SUCCESS!
      await loadUserData(); // Refresh data from DB
      setState(() {
        isLoading = false;
        currentlyEditingField = null; // Exit edit mode
      });
      return "success";
    } else {
      // FAILURE
      setState(() {
        isLoading = false;
        fieldErrorMessage = result; // Show error under the field
      });
      return result;
    }
  }

  Future<String?> showPasswordDialog() async {
    final passwordController = TextEditingController();

    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Enter Password'),
        content: TextField(
          controller: passwordController,
          obscureText: true,
          decoration: InputDecoration(labelText: 'Password'),
        ),
        actions: [
          TextButton(
            child: Text('Cancel'),
            onPressed: () => Navigator.pop(context),
          ),
          TextButton(
            child: Text('Confirm'),
            onPressed: () {
              Navigator.pop(context, passwordController.text);
            },
          ),
        ],
      ),
    );
  }

  void openCurrencyPicker() {
    showCurrencyPicker(
      context: context,
      showFlag: true,
      showCurrencyName: true,
      showCurrencyCode: true,
      onSelect: (Currency currency) {
        setState(() {
          selectedCurrency = currency.code; // e.g., "USD"
        });
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            handleSave("currency");
          }
        });
      },
    );
  }

  Widget buildEditableField({
    required String label,
    required TextEditingController controller,
    required String field,
  }) {
    final isEditing = currentlyEditingField == field;

    if (isEditing) {
      // --- EDIT MODE ---
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  decoration: InputDecoration(labelText: label),
                ),
              ),
              // Cancel Button
              IconButton(
                icon: Icon(Icons.close),
                onPressed: () {
                  setState(() {
                    controller.text = originalValue; // Revert to old state
                    currentlyEditingField = null;
                    fieldErrorMessage = null;
                  });
                },
              ),
              // Save Button
              IconButton(
                icon: Icon(Icons.check),
                onPressed: () => handleSave(field),
              ),
            ],
          ),
          if (fieldErrorMessage != null && currentlyEditingField == field)
              Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: Text(fieldErrorMessage!, style: TextStyle(color: Colors.red)),
              )
          ],
      );
    } else {
      // --- VIEW MODE ---
      return ListTile(
        title: Text(label),
        subtitle: Text(controller.text),
        trailing: IconButton(
          icon: Icon(Icons.edit),
          onPressed: () {
            setState(() {
              originalValue = controller.text;
              currentlyEditingField = field;  // Enter edit mode
              fieldErrorMessage = null; // Clear previous error
            });
          },
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Settings"),
      ),
      body: Builder(
        builder: (context) {
          if (isLoading) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          if (errorMessage != null) {
            return Center(child: Text(errorMessage!));
          }
          
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              buildEditableField(
                label: "User's Name",
                field: "name",
                controller: nameController,
              ),
              buildEditableField(
                label: "Email",
                field: "email",
                controller: emailController,
              ),
              // Timezone Dropdown
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Timezone", style: Theme.of(context).textTheme.bodySmall),
                    TimezoneDropdown(
                      key: ValueKey("timezone_dropdown"),
                      hintText: "Select Timezone",
                      value: selectedTimezone,
                      popupProps: const PopupProps.menu(
                        showSearchBox: true,
                        searchFieldProps: TextFieldProps(
                          decoration: InputDecoration(
                            labelText: 'Search Timezones',
                          ),
                        ),
                      ),
                      onTimezoneSelected: (timezone) {
                        WidgetsBinding.instance.addPostFrameCallback((_) {
                          if (mounted) {
                            setState(() {
                              selectedTimezone = timezone;
                            });
                            handleSave("timezone");
                          }
                        });
                      },
                    ),
                  ],
                ),
              ),
              ListTile(
                title: Text("Currency"),
                subtitle: Text(selectedCurrency ?? "Not set"),
                trailing: Icon(Icons.arrow_drop_down),
                onTap: openCurrencyPicker,
              )
            ],
          );
        }
      )
    );
  }
}