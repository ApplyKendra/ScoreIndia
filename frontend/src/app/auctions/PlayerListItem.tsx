
import { memo } from 'react';
import { getImageUrl } from '@/lib/utils';

// Updated Player type to match API response
interface Player {
    id: string | number;
    name: string;
    country: string;
    country_flag?: string;
    role: string;
    base_price: number;
    sold_price?: number;
    status: string;
    category?: string;
    team?: any;
    image_url?: string;
    // Legacy support for old format
    basePrice?: number;
    soldPrice?: number;
}

const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString()}`;
};

const PlayerListItem = memo(({ player }: { player: Player }) => {
    // Support both snake_case (API) and camelCase (legacy) formats
    const basePrice = player.base_price || player.basePrice || 0;
    const soldPrice = player.sold_price || player.soldPrice || 0;
    const teamName = typeof player.team === 'object' ? player.team?.name : player.team;

    return (
        <div className="group flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            {/* Avatar / Icon */}
            <div className={`w-10 h-10 flex-shrink-0 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xl border border-slate-200/60 overflow-hidden`}>
                {player.image_url ? (
                    <img src={getImageUrl(player.image_url)} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                    <span>{player.role === 'Batsman' ? '🏏' : player.role === 'Bowler' ? '🎯' : player.role === 'Wicketkeeper' ? '🧤' : '⭐'}</span>
                )}
            </div>

            {/* Name & Country */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 truncate">{player.name}</h3>
                    <span className="text-xs text-slate-500 font-medium px-1.5 py-0.5 bg-slate-100 rounded text-center min-w-[24px]">
                        {player.country_flag || player.country}
                    </span>
                </div>
                <p className="text-xs text-slate-500">{player.role}</p>
            </div>

            {/* Team (if sold) */}
            {player.status === 'sold' && teamName && (
                <div className="hidden sm:block text-right px-4">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Sold To</p>
                    <p className="text-sm font-semibold text-slate-700">{teamName}</p>
                </div>
            )}

            {/* Price & Status */}
            <div className="text-right flex flex-col items-end gap-1">
                <p className={`font-bold ${player.status === 'sold' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {player.status === 'sold'
                        ? formatCurrency(soldPrice)
                        : formatCurrency(basePrice)}
                </p>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${player.status === 'sold' ? 'bg-emerald-100 text-emerald-700' :
                        player.status === 'unsold' ? 'bg-slate-100 text-slate-600' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                        {player.status}
                    </span>
                </div>
            </div>
        </div>
    );
});

PlayerListItem.displayName = 'PlayerListItem';

export default PlayerListItem;
