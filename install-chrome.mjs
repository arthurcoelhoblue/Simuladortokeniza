import puppeteer from 'puppeteer';

(async () => {
  console.log('Baixando Chrome via Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  console.log('Chrome instalado com sucesso!');
  await browser.close();
  process.exit(0);
})();
