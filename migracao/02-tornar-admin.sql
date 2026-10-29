-- Rode DEPOIS de entrar uma vez na loja nova com gui23rocha@gmail.com
INSERT INTO public.user_roles(user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'gui23rocha@gmail.com'
ON CONFLICT DO NOTHING;
