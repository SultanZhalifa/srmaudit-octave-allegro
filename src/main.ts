/**
 * Application entry point. Imports the design system, installs global UI
 * services and delegated event handlers, then bootstraps the app.
 */
import './styles/main.css';
import { installDelegation } from '@/ui/dom';
import { installToasts } from '@/ui/toast';
import { installModalKeybinds } from '@/ui/modal';
import { registerGlobalActions } from '@/app/actions';
import { bootstrap } from '@/app/bootstrap';

function showLoadingError(message: string): void {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `<div style="padding:40px;text-align:center;color:#b4452e;font-family:system-ui;">
      <h2>Failed to start</h2><p>${message}</p></div>`;
  }
}

async function start(): Promise<void> {
  installToasts();
  installDelegation();
  installModalKeybinds();
  registerGlobalActions();
  try {
    await bootstrap();
  } catch (err) {
    console.error('[main] bootstrap failed:', err);
    showLoadingError((err as Error).message);
  }
}

void start();
