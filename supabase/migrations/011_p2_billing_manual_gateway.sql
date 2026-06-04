-- P2.2: manual gateway for dev/mock checkout (no real provider call)

ALTER TYPE payment_gateway ADD VALUE IF NOT EXISTS 'manual';
