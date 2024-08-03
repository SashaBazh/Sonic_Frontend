interface TelegramWebApp {
    [x: string]: any;
    showAlert(message: string): void;
    initData?: string;
    // Добавьте другие методы и свойства, если необходимо
  }
  
  interface Telegram {
    WebApp: TelegramWebApp;
  }
  
  declare global {
    interface Window {
      Telegram: Telegram;
    }
  }
  
  export {};