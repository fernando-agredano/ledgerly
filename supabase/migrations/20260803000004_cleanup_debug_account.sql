-- =====================================================================
-- VECTIS / HSI — 0010 Limpieza de cuenta de depuración
-- Al diagnosticar el bug de la franja blanca en los modales tuve que
-- registrar una cuenta de prueba para llegar a una pantalla autenticada.
-- Quedó sin confirmar (el proyecto exige confirmación de correo), pero el
-- trigger on_auth_user_created ya le había creado su fila en profiles.
-- Se borra aquí (cascada desde auth.users limpia también public.profiles).
-- =====================================================================

delete from auth.users where email like 'debug-toast-%@example.com';
