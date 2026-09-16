-- The Poster Wala v8.1: canonical IDs used by universal-poster.html.
-- Safe to run more than once.

INSERT INTO module_settings(module_id, display_name, price_paise) VALUES
  ('vehicle-sale', 'Car / Bike Sale', 2900),
  ('animal-sale', 'Dog / Animal Sale', 2900),
  ('path', 'Akhand Path / Sukhmani Sahib', 2900),
  ('general-invite', 'General Invitation', 2900),
  ('protest', 'Protest Poster', 2900),
  ('announcement', 'Public Announcement', 2900)
ON CONFLICT(module_id) DO UPDATE SET display_name=excluded.display_name;
