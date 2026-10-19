INSERT INTO analyzer_document_templates (id, title_fa, layout_key, brand_name_fa, system)
VALUES
  ('casio-ss', 'کاسیو · پنج‌لایه', 'casio-ss', 'کاسیو', TRUE)
ON CONFLICT (id) DO NOTHING;

UPDATE analyzer_document_templates
SET layout_key = 'casio-ss',
    brand_name_fa = 'کاسیو',
    updated_at = NOW()
WHERE id = 'casio-research';
