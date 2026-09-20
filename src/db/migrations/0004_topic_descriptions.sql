UPDATE topics SET description_fa = 'مدل‌های زبانی و عامل‌های هوشمند برای بازیابی دانش، اتصال به ابزار، و شفاف‌سازی مسئله در اکوسیستم هادیران.'
WHERE slug = 'ai' AND (description_fa IS NULL OR description_fa = '');

UPDATE topics SET description_fa = 'پروتکل باز Model Context Protocol برای اتصال مدل به داده، فایل و ابزار واقعی — بدون جعبه‌سیاه فروشنده.'
WHERE slug = 'mcp' AND (description_fa IS NULL OR description_fa = '');

UPDATE topics SET description_fa = 'لایهٔ مالکیت دیجیتال اینترنت: رمزنگاری، قرارداد هوشمند و شبکهٔ توزیع‌شده به‌جای پلتفرم متمرکز.'
WHERE slug = 'web3' AND (description_fa IS NULL OR description_fa = '');

UPDATE topics SET description_fa = 'حذف کار تکراری با مرز روشن بین آنچه ماشین می‌تواند انجام دهد و آنچه نیاز به قضاوت انسانی دارد.'
WHERE slug = 'automation' AND (description_fa IS NULL OR description_fa = '');

UPDATE topics SET description_fa = 'بسته‌بندی و اجرای یکسان محیط توسعه، سرویس و آزمایش — زیربنای تحویل تکرارپذیر.'
WHERE slug = 'docker' AND (description_fa IS NULL OR description_fa = '');

UPDATE topics SET description_fa = 'دفترکل توزیع‌شده به‌عنوان زیربنای دارایی دیجیتال، هویت و قرارداد هوشمند.'
WHERE slug = 'blockchain' AND (description_fa IS NULL OR description_fa = '');

UPDATE topics SET description_fa = 'موجودیت‌ها و روابط پایدار؛ هستی‌شناسی اول، رابط کاربری بعد. پل بین دانش، پروژه و دوره.'
WHERE slug = 'knowledge-graph' AND (description_fa IS NULL OR description_fa = '');

UPDATE topics SET description_fa = 'زبان تایپ‌شده برای محصول، ابزار MCP و لایهٔ ارائهٔ هادیران.'
WHERE slug = 'typescript' AND (description_fa IS NULL OR description_fa = '');
