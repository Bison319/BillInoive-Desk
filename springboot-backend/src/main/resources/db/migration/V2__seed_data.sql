-- =====================================================
-- BillCraft Desktop - Seed Data
-- V2: Default users, sample data, and settings
-- =====================================================

-- Default Admin User (password: admin123)
-- BCrypt hash for 'admin123'
INSERT INTO users (username, password, full_name, email, role, active, created_at, updated_at) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'System Administrator', 'admin@billcraft.com', 'ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Default Reminder Configs
INSERT INTO reminder_config (name, interval_days, enabled, created_at) VALUES
('First Reminder', 3, true, CURRENT_TIMESTAMP),
('Second Reminder', 7, true, CURRENT_TIMESTAMP),
('Final Reminder', 14, true, CURRENT_TIMESTAMP);

-- Default App Settings
INSERT INTO app_settings (setting_key, setting_value, description) VALUES
('company.name', 'BillCraft', 'Company name shown on invoices'),
('company.address', '', 'Company address for invoices'),
('company.phone', '', 'Company phone number'),
('company.email', '', 'Company email'),
('company.gst_number', '', 'Company GST number'),
('invoice.prefix', 'INV-', 'Invoice number prefix'),
('invoice.starting_number', '1001', 'Invoice starting number'),
('currency.symbol', '₹', 'Currency symbol'),
('currency.code', 'INR', 'Currency code'),
('thermal.printer_name', '', 'Thermal printer name'),
('thermal.paper_width', '80', 'Thermal paper width in mm'),
('backup.auto_enabled', 'true', 'Enable automatic backups'),
('backup.interval_hours', '24', 'Auto backup interval in hours');

-- Sample Products (Wood Industry)
INSERT INTO products (product_name, category, unit_price, gst_percentage, stock_quantity, active, created_at, updated_at) VALUES
('Teak Wood Plank 6ft', 'Teak', 4500.00, 18.00, 100, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Teak Wood Plank 8ft', 'Teak', 6000.00, 18.00, 80, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Teak Wood Log', 'Teak', 12000.00, 18.00, 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Rosewood Panel 4x8', 'Rosewood', 8500.00, 18.00, 50, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Rosewood Beam 10ft', 'Rosewood', 15000.00, 18.00, 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Pine Wood Plank 6ft', 'Pine', 1500.00, 12.00, 200, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Pine Wood Board 4x4', 'Pine', 1200.00, 12.00, 150, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Plywood Sheet 4x8 (18mm)', 'Plywood', 2200.00, 18.00, 300, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Plywood Sheet 4x8 (12mm)', 'Plywood', 1800.00, 18.00, 250, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Plywood Sheet 4x8 (6mm)', 'Plywood', 1200.00, 18.00, 200, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('MDF Board 4x8', 'MDF', 1600.00, 18.00, 180, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('MDF Board 4x6', 'MDF', 1200.00, 18.00, 120, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Sal Wood Beam 8ft', 'Sal', 3500.00, 12.00, 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Sal Wood Plank 6ft', 'Sal', 2500.00, 12.00, 90, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Cedar Wood Log', 'Cedar', 9000.00, 18.00, 25, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Cedar Wood Plank 6ft', 'Cedar', 5500.00, 18.00, 40, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Particle Board 4x8', 'Particle Board', 900.00, 18.00, 500, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Block Board 4x8', 'Block Board', 2800.00, 18.00, 100, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Veneer Sheet (Teak)', 'Veneer', 600.00, 18.00, 400, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Veneer Sheet (Walnut)', 'Veneer', 800.00, 18.00, 300, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Bamboo Panel 4x8', 'Bamboo', 1400.00, 5.00, 150, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Rubber Wood Plank 6ft', 'Rubber Wood', 1800.00, 12.00, 120, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Mahogany Plank 6ft', 'Mahogany', 7000.00, 18.00, 35, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Deodar Wood Beam 8ft', 'Deodar', 4000.00, 12.00, 45, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Neem Wood Log', 'Neem', 2000.00, 12.00, 55, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
