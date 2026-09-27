-- ====================================================================
-- SUPABASE / POSTGRES SCHEMA MIGRATION FOR LOCAL LEAD FINDER & OUTREACH
-- ====================================================================

-- 1. Tabela za leadove
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  category TEXT,
  rating NUMERIC(2, 1),
  review_count INTEGER,
  address TEXT,
  phone TEXT,
  website TEXT,
  maps_url TEXT,
  lead_score INTEGER DEFAULT 0,
  score_reasons JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'NEW',
  analysis JSONB,
  generated_message TEXT,
  selected_template TEXT,
  eligibility JSONB,
  last_contact_at TIMESTAMPTZ,
  next_followup_at TIMESTAMPTZ,
  followup_count INTEGER DEFAULT 0,
  do_not_contact BOOLEAN DEFAULT FALSE,
  do_not_contact_reason TEXT,
  last_error JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeksi za brzu pretragu
CREATE INDEX IF NOT EXISTS idx_leads_city ON leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_do_not_contact ON leads(do_not_contact);

-- 2. Tabela za poruke i konverzacije
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
  direction TEXT CHECK (direction IN ('incoming', 'outgoing')),
  text TEXT NOT NULL,
  template_name TEXT,
  template_variables JSONB,
  whatsapp_message_id TEXT,
  status TEXT DEFAULT 'sent',
  error_code TEXT,
  error_message TEXT,
  ai_classification TEXT,
  ai_suggested_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_id ON messages(whatsapp_message_id);

-- 3. Tabela za DO NOT CONTACT listu
CREATE TABLE IF NOT EXISTS do_not_contact_list (
  phone TEXT PRIMARY KEY,
  business_name TEXT,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela za WhatsApp Templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  name TEXT PRIMARY KEY,
  language TEXT NOT NULL DEFAULT 'bs',
  category TEXT NOT NULL DEFAULT 'MARKETING',
  header TEXT,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'APPROVED',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela za postavke i AI prodajni kontekst
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'global_settings',
  my_name TEXT NOT NULL DEFAULT 'Arman Trako',
  agency_name TEXT NOT NULL DEFAULT 'Trako Web Studio',
  service_description TEXT,
  base_price TEXT DEFAULT '450 KM',
  maintenance_price TEXT DEFAULT '50 KM/mjesečno',
  demo_url TEXT DEFAULT 'https://restoran-demo.ba',
  phone TEXT,
  email TEXT,
  target_cities JSONB DEFAULT '["Visoko", "Travnik", "Zenica", "Sarajevo", "Mostar", "Vitez"]'::jsonb,
  message_tone TEXT DEFAULT 'friendly',
  whatsapp_message_type TEXT DEFAULT 'template',
  active_template TEXT DEFAULT 'website_outreach_v1',
  auto_outreach_enabled BOOLEAN DEFAULT FALSE,
  max_daily_outreach INTEGER DEFAULT 20,
  max_hourly_outreach INTEGER DEFAULT 5,
  min_delay_seconds INTEGER DEFAULT 35,
  max_followups INTEGER DEFAULT 2,
  followup_delay_days INTEGER DEFAULT 3,
  ai_provider TEXT DEFAULT 'builtin',
  ai_model TEXT DEFAULT 'gpt-4o-mini',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela za Audit Logove
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  lead_id TEXT,
  business_name TEXT,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  channel TEXT NOT NULL,
  message_id TEXT,
  error TEXT,
  details TEXT,
  source TEXT DEFAULT 'manual'
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
