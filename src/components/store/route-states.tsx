import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
export function RouteError(){return <div className="page-width empty-state"><h2>Não foi possível carregar esta página</h2><p>Tente novamente em alguns instantes.</p><Button asChild><Link to="/">Voltar ao início</Link></Button></div>;}
export function RouteMissing(){return <div className="page-width empty-state"><h2>Peça não encontrada</h2><Button asChild><Link to="/catalogo">Explorar catálogo</Link></Button></div>;}
