"""Self-contained visual review; screenshots are from the actual tested local app."""
from pathlib import Path
import base64
from PIL import Image
root=Path(__file__).resolve().parent.parent
output=root.parent/'deliverables/hadiran-public-garden.html'
assets=output.parent/'garden-assets';assets.mkdir(parents=True,exist_ok=True)
def image(name,box=None):
 im=Image.open(root/'qa'/name)
 if box:im=im.crop(box)
 path=assets/name;im.save(path,optimize=True)
 return 'data:image/png;base64,'+base64.b64encode(path.read_bytes()).decode()
font=base64.b64encode((root/'src/app/fonts/IRANSharp-Regular.woff2').read_bytes()).decode()
views=[('دو درِ ورود',image('garden-desktop-light.png'),'نمای واقعی دسکتاپ؛ گفت‌وگوی فعلی، یادداشت‌ها و پایان آرام.'),
 ('خواندن در همان صفحه',image('garden-reading-light.png'),'کارت بازشده، کپی متن، موضوع واقعی و پیوند صفحهٔ مستقل.'),
 ('موبایل / تاریک',image('garden-mobile-dark.png'),'نمای واقعی ۳۷۵ پیکسل؛ پنل‌های باز و انتخاب تصادفی.'),
 ('وضعیت خالی واقعی',image('garden-empty-light.png'),'دیتابیس در دسترس است، اما نوشتهٔ واجد شرایطی ندارد؛ محتوا جعل نمی‌شود.')]
buttons=''.join(f'<button onclick="show({i})" aria-pressed="{str(i==0).lower()}">{label}</button>' for i,(label,_,_) in enumerate(views))
figures=''.join(f'<figure {"hidden" if i else ""}><figcaption>{caption}</figcaption><img alt="{label}" src="{data}" style="max-width:{430 if i==2 else 1100}px"></figure>' for i,(label,data,caption) in enumerate(views))
html='''<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>هادیران · نمونهٔ پرسه‌زنی هدفمند</title><style>
@font-face{font-family:IRANSharp;src:url(data:font/woff2;base64,FONT)}*{box-sizing:border-box}body{margin:0;background:#fbf9f5;color:#151a22;font:15px/2 IRANSharp,system-ui}header,main{max-width:1200px;margin:auto;padding:28px 24px}h1{font-size:27px;margin:8px 0}header>span{color:#0b6f6b}p{margin:10px 0;color:#565a61}.notice{border-right:3px solid #0f8f8a;padding:10px 18px;background:#edf3f0;border-radius:4px}.open{display:inline-block;padding:8px 14px;border:1px solid #0b6f6b;border-radius:5px;color:#0b6f6b;text-decoration:none}.small{font-size:12px}nav{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}button{font:inherit;border:1px solid #d4cdbf;background:transparent;padding:7px 14px;border-radius:5px;cursor:pointer;color:inherit}button[aria-pressed=true]{background:#0b6f6b;border-color:#0b6f6b;color:white}button:focus-visible,a:focus-visible{outline:2px solid #0b6f6b;outline-offset:4px}figure{margin:0}figure[hidden]{display:none}figcaption{font-size:13px;color:#636973;margin-bottom:16px}img{width:100%;height:auto;display:block;margin:auto;border:1px solid #e8e2d6;border-radius:8px}.facts{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:#565a61;margin-top:18px}.facts span{border:1px solid #e8e2d6;padding:4px 10px;border-radius:4px}details{margin-top:14px;font-size:13px}summary{cursor:pointer}code{direction:ltr;unicode-bidi:embed}@media(max-width:600px){h1{font-size:22px}header,main{padding:20px 16px}button{font-size:13px}}
</style><header><span>هادیران / مرور نمونهٔ مستقل</span><h1>از «یک گره را باز کنیم» تا «در کارگاه بگرد»</h1><p>صفحهٔ اصلی و پرترهٔ فعلی محفوظ‌اند. این فایل مرور تصویریِ اجرای واقعی است؛ برای آزمون تعامل‌ها، در پنل پیش‌نمایش زنده سرویس «Hadiran — garden preview» مسیر <code>/garden-preview</code> را باز کن.</p><p class="notice">متن‌های یادداشت‌ها در این پیش‌نمایش آزمایشی و فقط در دیتابیس محلی QA هستند؛ محتوای واقعیِ محیط اصلی معرفی نمی‌شوند.</p><div class="facts"><span>HomeChat موجود، نه چت موازی</span><span>فقط نوشتهٔ عمومی و تأییدشده برای انتشار</span><span>۲۴ حالت نمایش + متن ۲۰۰٪</span><span>بدون dependency جدید / فقط WAAPI</span></div><details><summary>مرزهای این نمونه و اندازهٔ صفحه</summary><p>تاریخچه و تعداد بازبینی ساختگی نداریم. انتشار عمومی به معنای آزمون میدانی نیست. ورودی گفت‌وگو می‌تواند در سرور ذخیره شود؛ ادعای کلی «بدون ردیابی» نداریم.</p><p>HTML حدود ۱۱٫۲، JS مشترک حدود ۱۶۶٫۴ و CSS حدود ۲۱٫۰ KiB با gzip محاسبه‌شده؛ فونت‌های WOFF2 حدود ۱۲۴٫۶ KiB. کل صفحه زیر ۵۰KB نیست. اعداد اندازه‌اند، نه سرعت production.</p><p>هیچ تغییر محیط اصلی، push/deploy یا انتقال Drive انجام نشده است.</p></details><nav aria-label="نماهای بازبینی">BUTTONS</nav></header><main>FIGURES</main><script>function show(n){document.querySelectorAll('figure').forEach((el,i)=>el.hidden=i!==n);document.querySelectorAll('nav button').forEach((el,i)=>el.setAttribute('aria-pressed',String(i===n)))}</script></html>'''
for k,v in [('FONT',font),('BUTTONS',buttons),('FIGURES',figures)]:html=html.replace(k,v)
output.write_text(html);print(output)
