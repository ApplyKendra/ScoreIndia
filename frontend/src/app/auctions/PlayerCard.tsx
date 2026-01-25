import { memo } from 'react';
import { Card } from '@/components/ui/card';

export interface Player {
    id: number;
    name: string;
    role: string;
    country: string;
    basePrice: number;
    matches: number;
    runs?: number;
    avg?: number;
    wickets?: number;
    economy?: number;
    status: string;
    category: string;
    soldPrice?: number;
    team?: string;
}

const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString()}`;
};

const PlayerCard = memo(({ player }: { player: Player }) => {
    return (
        <Card className="group relative overflow-hidden bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-slate-200/50">
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Status Badge */}
            <div className="absolute top-4 right-4">
                {player.status === 'available' && (
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/30">
                        Available
                    </span>
                )}
                {player.status === 'sold' && (
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/30">
                        Sold
                    </span>
                )}
                {player.status === 'unsold' && (
                    <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">
                        Unsold
                    </span>
                )}
            </div>

            <div className="relative z-10 flex items-start gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/30 ring-2 ring-white">
                    {player.role === 'Batsman' ? '🏏' : player.role === 'Bowler' ? '🎯' : player.role === 'Wicketkeeper' ? '🧤' : '⭐'}
                </div>
                <div className="flex-1 pt-1">
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">{player.name}</h3>
                    <p className="text-sm text-slate-500">{player.country} {player.role}</p>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
                {player.status === 'sold' ? (
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Sold to</p>
                            <p className="text-sm sm:text-base font-bold text-slate-900">{player.team}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Final Price</p>
                            <p className="text-lg sm:text-xl font-black text-emerald-600">{formatCurrency(player.soldPrice!)}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Base Price</p>
                            <p className="text-lg sm:text-xl font-black text-blue-600">{formatCurrency(player.basePrice)}</p>
                        </div>
                        <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                            {player.category}
                        </span>
                    </div>
                )}
            </div>
        </Card>
    );
});
PlayerCard.displayName = 'PlayerCard';

export default PlayerCard;
