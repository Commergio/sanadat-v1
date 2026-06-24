-- Manual bank transfer: optional discount coupon snapshot on the request

ALTER TABLE manual_payment_requests
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES discount_coupons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS original_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2);

COMMENT ON COLUMN manual_payment_requests.coupon_code IS 'Applied discount code at submission time';
COMMENT ON COLUMN manual_payment_requests.original_amount IS 'Plan price before coupon';
COMMENT ON COLUMN manual_payment_requests.discount_amount IS 'Coupon discount amount';
