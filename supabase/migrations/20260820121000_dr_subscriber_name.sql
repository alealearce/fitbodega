-- Step 1 of the creator flow asks for a first name alongside the email so the
-- weekly Deal Radar can address people by name. Optional — the email alone is
-- still a complete signup.
alter table dr_subscribers add column if not exists first_name text;
