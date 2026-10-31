import assert from 'node:assert/strict';
import http from 'node:http';
import { readFileSync } from 'node:fs';
import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=path.resolve('dist/static-pwa');
const base=process.env.PWA_BASE || '/hadith-alqulub/';
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(!url.pathname.startsWith(base)){res.writeHead(404).end();return;}
 const relative=decodeURIComponent(url.pathname.slice(base.length))||'index.html';
 const f=path.resolve(root,relative);
 if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{const body=readFileSync(f);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[path.extname(f)]||'application/octet-stream');res.end(body);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}${base}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:JSON.parse(process.env.CHROMIUM_ARGS||'[]'),headless:true});
try {
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const page=await context.newPage(); const errors=[], external=[];
 page.on('pageerror',e=>errors.push(e.message));
 context.on('request',r=>{if(!r.url().startsWith(new URL(url).origin))external.push(r.url());});
 await page.goto(url);
 await page.getByLabel('اسم اللاعب الأول').fill('علي');
 await page.getByLabel('اسم اللاعب الثاني').fill('فاطمة');
 assert.equal(await page.getByLabel('اسم اللاعب الأول').inputValue(),'علي','Tour must permit input');
 await page.getByLabel('تخطي الجولة التعريفية').click();
 await page.getByRole('button',{name:'بدء الجلسة',exact:false}).click();
 await page.getByRole('button',{name:/علي/}).click();
 for(const name of ['نصيحة','إنهاء','جديد'])assert(await page.getByRole('button',{name,exact:true}).isVisible(),`${name} is visible on mobile`);
 await page.locator('.question-card').first().click();
 const prompt=await page.locator('.legacy-question-card__copy').innerText();
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
 await context.setOffline(true);
 await page.reload();await page.getByRole('button',{name:'استئناف جلسة سابقة'}).click();
 assert.equal(await page.locator('.legacy-question-card__copy').innerText(),prompt);
 await page.getByRole('button',{name:'أجبتُ عن السؤال',exact:true}).click();
 await page.getByRole('button',{name:'إنهاء',exact:true}).click();await page.keyboard.press('1');
 assert.equal(await page.locator('.legacy-question-card').count(),0);
 await page.getByRole('button',{name:'حفظ الجلسة وإنهاؤها'}).click();
 await page.getByLabel('تفعيل الوضع الفاتح').click();
 await page.reload();assert(!(await page.locator('html').getAttribute('class')||'').includes('dark'));
 await page.getByRole('link',{name:'التوثيق',exact:true}).click();
 await page.getByRole('link',{name:'العودة إلى اللعبة'}).waitFor();
 await page.reload();await page.getByRole('link',{name:'العودة إلى اللعبة'}).waitFor();
 await page.getByRole('link',{name:'العودة إلى اللعبة'}).click();
 await page.getByRole('button',{name:'استئناف جلسة سابقة'}).click();
 for(const size of [{width:320,height:568},{width:844,height:390},{width:1280,height:800}]){
   await page.setViewportSize(size);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
   await page.locator('.question-card:not([disabled])').first().click();
   assert(await page.getByRole('button',{name:'أجبتُ عن السؤال',exact:true}).isVisible());
   if(process.env.SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,`question-${size.width}.png`),fullPage:true});
   await page.getByRole('button',{name:'أجبتُ عن السؤال',exact:true}).click();
 }
 await page.setViewportSize({width:320,height:568});
 await page.locator('.question-card:not([disabled])').first().click();
 await page.evaluate(()=>{const key='hadith-alqulub-platform-session-v1';const saved=JSON.parse(localStorage.getItem(key));saved.activeCard.prompt='سؤال طويل لاختبار القراءة والتمرير '.repeat(65);localStorage.setItem(key,JSON.stringify(saved));});
 await page.reload();await page.getByRole('button',{name:'استئناف جلسة سابقة'}).click();
 const metrics=await page.locator('.legacy-question-card__copy').evaluate(el=>({height:el.clientHeight,scroll:el.scrollHeight,overflow:getComputedStyle(el).overflowY}));
 assert(metrics.height>0 && metrics.scroll>metrics.height && metrics.overflow==='auto','Long question must scroll inside the card');
 await page.getByRole('button',{name:'أجبتُ عن السؤال',exact:true}).click();
 const reopened=await context.newPage();await reopened.goto(url);assert(await reopened.getByRole('button',{name:'استئناف جلسة سابقة'}).isVisible());
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 console.log('PASS: mobile onboarding input, toolbar, offline reload/open, pending card restore, keyboard guards, saved theme, offline lazy route, 3 viewport sizes, no external requests or JS errors.');
 await context.close();
} finally {await browser.close();await new Promise(r=>server.close(r));}
