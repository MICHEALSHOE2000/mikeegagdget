import {test,expect} from '@playwright/test';

test('homepage search, keyboard, full results and exact purchase context',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 const search=page.getByLabel('What are you looking for?');
 await search.fill('iPhone 17 Pro Max');
 await expect(page.locator('#searchResults')).toContainText('iPhone 17 Pro Max');
 await search.press('ArrowDown');
 await expect(page.locator('#searchResults a').first()).toBeFocused();
 await page.locator('#searchResults a').first().press('Escape');
 await expect(search).toBeFocused();
 await search.press('Enter');
 await expect(page).toHaveURL(/\/search\/\?q=/);
 await expect(page.locator('#resultsCount')).toContainText('1 matching model');
 await page.getByRole('link',{name:'View Options →'}).click();
 await expect(page.getByRole('heading',{name:'iPhone 17 Pro Max',exact:true})).toBeVisible();
 await expect(page.getByLabel('SIM configuration',{exact:true})).toHaveValue('Other / Unconfirmed');
 const selected=await page.locator('[data-offer-actions] a').first().getAttribute('href');
 await page.locator('[data-offer-actions] a').first().click();
 await expect(page).toHaveURL(/\/buy\//);
 expect(new URL(page.url()).searchParams.get('phone')).toBe(new URL(selected,'http://localhost').searchParams.get('phone'));
 await expect(page.locator('#order-summary')).toContainText('iPhone 17 Pro Max');
 expect(errors).toEqual([]);
});

test('responsive homepage, search and product layouts have no horizontal overflow',async({page},testInfo)=>{
 for(const path of ['/','/search/?q=samsung','/iphone-17-air/','/iphones/']){
  await page.goto(path);await page.locator('main').waitFor();
  if(path==='/')await expect(page.locator('#resultsCount')).toContainText('matching model');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  await page.screenshot({path:testInfo.outputPath(path==='/'?'homepage.png':path.startsWith('/search')?'search.png':path.startsWith('/iphones')?'catalogue.png':'product.png'),fullPage:true});
 }
});

test('non-activation, UK Used, missing prices and filters use actual inventory',async({page})=>{
 await page.goto('/iphone-17-air/');
 await expect(page.getByLabel('Condition',{exact:true})).toHaveValue('Brand New — Non-Activated');
 await page.getByLabel('Condition',{exact:true}).selectOption('UK Used');
 await expect(page.getByLabel('Storage',{exact:true})).toHaveValue('256GB');
 const easy=page.locator('[data-offer-actions]').getByRole('link',{name:'Pay Small Small',exact:true});
 await easy.click();await expect(page.locator('#journey-screen')).toContainText('UK Used');
 await page.goto('/samsung-s23/');await expect(page.locator('[data-offer-summary]')).toContainText('Confirm price');
 await page.goto('/search/?condition=UK+Used&storage=128GB');
 await expect(page.locator('#conditionFilter')).toHaveValue('UK Used');
 await page.locator('#searchInput').fill('zzzzzzzz');await expect(page.locator('#productGrid')).toContainText('No matching devices');
 await page.getByRole('button',{name:'Clear filters',exact:true}).last().click();
 await expect(page.locator('#productGrid .store-phone').first()).toBeVisible();
});
