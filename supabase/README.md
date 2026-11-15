# Configurar Supabase (una sola vez)

1. Crea un proyecto gratis en https://supabase.com.
2. En **SQL Editor**, pega y ejecuta `supabase/migrations/20260101000000_app_state.sql` (idempotente: segura aunque la tabla ya exista).
   Los cambios futuros de base de datos van como nuevos archivos en `supabase/migrations/`, siempre aditivos. Antes de cualquier cambio haz un respaldo (botón "Respaldo" de la app y/o Backups de Supabase).
3. En **Authentication > Providers**, deja habilitado "Email". Si no quieres que pida confirmar
   correo, desactiva "Confirm email" en Authentication > Settings (más rápido para uso personal).
4. En **Project Settings > API**, copia:
   - `Project URL` → pégalo en `.env` como `VITE_SUPABASE_URL`
   - `anon public key` → pégalo en `.env` como `VITE_SUPABASE_ANON_KEY`
5. Copia `.env.example` a `.env` y llena esos dos valores.
6. `npm install` y `npm run dev`.
7. Si despliegas en Vercel, agrega esas mismas dos variables en Project Settings > Environment Variables.

Con esto, cada dato (horas extra, transporte, deudas, lista de deseos, salarios) se guarda en la nube
y se sincroniza en tiempo real entre todos los dispositivos donde entres con la misma cuenta.
