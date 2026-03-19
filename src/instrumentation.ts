export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run if not already registered (useful for dev mode caching)
    if (!(globalThis as any).isCronRegistered) {
      (globalThis as any).isCronRegistered = true;
      
      const cron = await import('node-cron');
      const { startSignatureReminderCron } = await import('./cron');
      
      console.log('✅ Starting Background Schedule Jobs via Instrumentation');
      startSignatureReminderCron(cron.default);
    }
  }
}
