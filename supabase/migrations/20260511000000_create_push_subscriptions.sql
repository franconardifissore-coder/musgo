-- ============================================================
-- Push subscriptions para Web Push / PWA
-- Cada fila representa un dispositivo registrado de un usuario.
-- Un usuario puede tener múltiples suscripciones (teléfono, tablet, etc.)
-- ============================================================

CREATE TABLE public.push_subscriptions (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   text        NOT NULL,
  p256dh     text        NOT NULL,   -- clave pública del dispositivo (cifrado)
  auth       text        NOT NULL,   -- secret de autenticación del dispositivo
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, endpoint)         -- un endpoint no se registra dos veces por usuario
);

-- Índice para buscar rápido por user_id (el cron lo necesita)
CREATE INDEX push_subscriptions_user_id_idx ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Cada usuario solo ve y gestiona sus propias suscripciones
CREATE POLICY "Users can manage own push subscriptions"
ON public.push_subscriptions
FOR ALL
TO authenticated
USING  (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
