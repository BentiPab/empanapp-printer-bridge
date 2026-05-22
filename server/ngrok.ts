import ngrok from '@ngrok/ngrok';

export async function iniciarNgrok(): Promise<void> {
  const authToken = process.env.NGROK_SECRET;
  const domain = process.env.NGROK_DOMAIN;

  if (!authToken || !domain) {
    console.log("⚠️ Variables de ngrok ausentes en el .env. Corriendo solo local.");
    return;
  }

  console.log("Iniciando puente de impresión con ngrok...");

  try {
    // Creamos la sesión pasando el token directamente
    const session = await new ngrok.SessionBuilder()
      .authtoken(authToken)
      .connect();

    // Levantamos el endpoint apuntando a nuestro puerto local y usando el dominio estático
    const tunnel = await session.httpEndpoint()
      .domain(domain)
      .forwardsTo("localhost:3001")
      .requestHeader("ngrok-skip-browser-warning", "true")
      .listen();

    console.log(`🚀 Túnel seguro de ngrok activado exitosamente!`);
    console.log(`🔗 URL de impresión pública: ${tunnel.url()}`);
  } catch (error) {
    console.error('❌ Error al conectar el túnel de ngrok:', error);
  }
}