// import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
// import { AppModule } from './app/app.module';

// platformBrowserDynamic().bootstrapModule(AppModule)
//   .catch(err => console.error(err));


// main.ts
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

function isMobile() {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
}

if (isMobile()) {
  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err));
} else {
  document.body.innerHTML = `
    <div style="
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      text-align: center;
      padding: 20px;
      background-image: url('assets/images/Background2.png');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    ">
      <div style="
        background-color: rgba(255, 255, 255, 0.8);
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
      ">
        <h1 style="font-size: 24px; margin-bottom: 20px; color: #333;">This application is only available on mobile devices.</h1>
        <p style="font-size: 18px; color: #666;">Please open it on your smartphone or tablet.</p>
      </div>
    </div>
  `;
}