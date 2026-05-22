import ngrok from '@ngrok/ngrok';
import { initExpress } from './server';

export async function initNgrok(): Promise<void> {
  const authToken = process.env.NGROK_SECRET;
  const domain = process.env.NGROK_DOMAIN;

  if (!authToken || !domain) {
    console.log("⚠️ Variables de ngrok ausentes. Corriendo solo local.");
    initExpress();
    return;
  }

  try {
    console.log("1. Conectando sesión con ngrok...");
    const session = await new ngrok.SessionBuilder()
      .authtoken(authToken)
      .connect();

    console.log("2. Abriendo endpoint estático...");
    const tunnel = await session.httpEndpoint()
      .domain(domain)
      .forwardsTo("127.0.0.1:3001") // IP explícita
      .requestHeader("ngrok-skip-browser-warning", "true")
      .listen();

    console.log(`🚀 Túnel de ngrok activado exitosamente: ${tunnel.url()}`);
    
    // ➡️ RECIÉN ACÁ, CON EL TÚNEL LISTO, LEVANTAMOS EXPRESS
    initExpress();

  } catch (error) {
    console.error('❌ Error crítico al conectar el túnel de ngrok:', error);
    // Si ngrok falla, igual levantamos Express para que no muera el proceso local
    initExpress();
  }
}