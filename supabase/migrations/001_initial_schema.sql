-- نظام السندات - Initial Schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE user_role AS ENUM ('client', 'admin');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'suspended');
CREATE TYPE document_status AS ENUM ('active', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'pos');
CREATE TYPE payment_gateway AS ENUM ('moyasar', 'hyperpay', 'stc_pay');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE invoice_payment_status AS ENUM ('paid', 'unpaid', 'partial');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'success', 'error');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'client',
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT,
  cr_number TEXT,
  vat_number TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  stamp_url TEXT,
  profile_completed INTEGER DEFAULT 0 CHECK (profile_completed >= 0 AND profile_completed <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document number sequences (never reused)
CREATE TABLE document_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('receipt_voucher', 'payment_voucher', 'invoice')),
  last_number INTEGER NOT NULL DEFAULT 0,
  UNIQUE(company_id, document_type)
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status subscription_status NOT NULL DEFAULT 'active',
  amount DECIMAL(10,2) NOT NULL DEFAULT 399.00,
  currency TEXT NOT NULL DEFAULT 'SAR',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Receipt vouchers
CREATE TABLE receipt_vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  display_number TEXT NOT NULL,
  status document_status NOT NULL DEFAULT 'active',
  date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  party_name TEXT NOT NULL,
  payment_method payment_method NOT NULL,
  transfer_number TEXT,
  bank_name TEXT,
  reference_number TEXT,
  linked_invoice_id UUID,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, number)
);

-- Payment vouchers
CREATE TABLE payment_vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  display_number TEXT NOT NULL,
  status document_status NOT NULL DEFAULT 'active',
  date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  party_name TEXT NOT NULL,
  payment_method payment_method NOT NULL,
  transfer_number TEXT,
  bank_name TEXT,
  reference_number TEXT,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, number)
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  display_number TEXT NOT NULL,
  status document_status NOT NULL DEFAULT 'active',
  date DATE NOT NULL,
  party_name TEXT NOT NULL,
  description TEXT,
  payment_method payment_method NOT NULL,
  transfer_number TEXT,
  bank_name TEXT,
  reference_number TEXT,
  subtotal DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_status invoice_payment_status NOT NULL DEFAULT 'unpaid',
  linked_receipt_id UUID REFERENCES receipt_vouchers(id),
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, number)
);

-- Invoice items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments (subscription transactions)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  gateway payment_gateway NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SAR',
  status payment_status NOT NULL DEFAULT 'pending',
  gateway_reference TEXT,
  gateway_response JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- WhatsApp templates (admin)
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  template_body TEXT NOT NULL,
  variables JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_companies_user ON companies(user_id);
CREATE INDEX idx_receipt_vouchers_company ON receipt_vouchers(company_id);
CREATE INDEX idx_payment_vouchers_company ON payment_vouchers(company_id);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX idx_payments_company ON payments(company_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_activity_logs_company ON activity_logs(company_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER receipt_vouchers_updated_at BEFORE UPDATE ON receipt_vouchers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER payment_vouchers_updated_at BEFORE UPDATE ON payment_vouchers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sequences ENABLE ROW LEVEL SECURITY;

-- Profiles: users see own profile, admins see all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Companies: owner access
CREATE POLICY "Users can view own companies" ON companies FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own companies" ON companies FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own companies" ON companies FOR UPDATE USING (user_id = auth.uid());

-- Documents: company owner only (immutable - no update except cancel fields via function)
CREATE POLICY "Users can view own receipts" ON receipt_vouchers FOR SELECT
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own receipts" ON receipt_vouchers FOR INSERT
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own payments" ON payment_vouchers FOR SELECT
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own payments" ON payment_vouchers FOR INSERT
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own invoices" ON invoices FOR INSERT
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own invoice items" ON invoice_items FOR SELECT
  USING (invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));
CREATE POLICY "Users can insert own invoice items" ON invoice_items FOR INSERT
  WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));

-- Subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

-- Notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Activity logs
CREATE POLICY "Users can view own activity" ON activity_logs FOR SELECT
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

-- Function: Get next document number (atomic, never reused)
CREATE OR REPLACE FUNCTION get_next_document_number(p_company_id UUID, p_type TEXT, p_prefix TEXT)
RETURNS TABLE(number INTEGER, display_number TEXT) AS $$
DECLARE
  v_next INTEGER;
BEGIN
  INSERT INTO document_sequences (company_id, document_type, last_number)
  VALUES (p_company_id, p_type, 1)
  ON CONFLICT (company_id, document_type)
  DO UPDATE SET last_number = document_sequences.last_number + 1
  RETURNING last_number INTO v_next;

  number := v_next;
  display_number := p_prefix || '-' || v_next::TEXT;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Cancel document (only allowed mutation)
CREATE OR REPLACE FUNCTION cancel_document(
  p_table TEXT,
  p_id UUID,
  p_reason TEXT
) RETURNS VOID AS $$
BEGIN
  IF p_table = 'receipt_vouchers' THEN
    UPDATE receipt_vouchers SET status = 'cancelled', cancelled_at = NOW(), cancel_reason = p_reason WHERE id = p_id AND status = 'active';
  ELSIF p_table = 'payment_vouchers' THEN
    UPDATE payment_vouchers SET status = 'cancelled', cancelled_at = NOW(), cancel_reason = p_reason WHERE id = p_id AND status = 'active';
  ELSIF p_table = 'invoices' THEN
    UPDATE invoices SET status = 'cancelled', cancelled_at = NOW(), cancel_reason = p_reason WHERE id = p_id AND status = 'active';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
