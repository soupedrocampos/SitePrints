import { Map, MapPin } from 'lucide-react'

interface MapPreviewProps {
    location: string
}

export default function MapPreview({ location }: MapPreviewProps) {
    // Use an OpenStreetMap embed as a free map preview
    const encodedLocation = encodeURIComponent(location || 'Brasil')
    const osmUrl = location
        ? `https://www.openstreetmap.org/export/embed.html?bbox=-73.99,-33.75,-28.84,5.27&layer=mapnik&marker=0,0`
        : null

    return (
        <div className="relative w-full h-full min-h-[400px] lg:min-h-full rounded-2xl overflow-hidden glass">
            {/* Decorative grid overlay */}
            <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)
          `,
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Gradient overlay on top */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-transparent to-cyan-950/30 pointer-events-none z-10" />

            {/* Map content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-20">
                {/* Pulsing location dot */}
                <div className="relative mb-6">
                    <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <Map size={26} className="text-indigo-400" />
                    </div>
                    {location && (
                        <>
                            <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
                            <div className="absolute -inset-2 rounded-full bg-indigo-500/10 animate-pulse" />
                        </>
                    )}
                </div>

                {location ? (
                    <>
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin size={14} className="text-indigo-400" />
                            <span className="text-sm font-semibold text-white">{location}</span>
                        </div>
                        <p className="text-xs text-slate-500">Localização configurada para busca</p>
                        <div className="mt-6 flex flex-wrap justify-center gap-2">
                            {['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador'].map((city) => (
                                <span key={city} className="text-[11px] text-slate-600 bg-slate-800/60 border border-slate-700 px-2 py-1 rounded-full">
                                    {city}
                                </span>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <h3 className="text-base font-semibold text-white mb-2">Prévia do Mapa</h3>
                        <p className="text-sm text-slate-500 max-w-xs">
                            Insira uma localização no formulário e pressione{' '}
                            <span className="text-indigo-400 font-medium">Buscar</span> para ver os resultados no mapa.
                        </p>
                    </>
                )}
            </div>

            {/* Decorative dots */}
            <div className="absolute top-4 right-4 flex gap-1.5 z-20">
                <div className="w-2 h-2 rounded-full bg-red-400/60" />
                <div className="w-2 h-2 rounded-full bg-yellow-400/60" />
                <div className="w-2 h-2 rounded-full bg-green-400/60" />
            </div>

            {/* Bottom info bar */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-slate-900 to-transparent p-4 pt-8">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-600">Google Maps • CRM Business Search</span>
                    <span className="text-[10px] text-indigo-500 font-medium">API Integrada</span>
                </div>
            </div>
        </div>
    )
}
