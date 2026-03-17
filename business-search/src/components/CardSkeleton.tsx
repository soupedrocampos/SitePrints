export default function CardSkeleton() {
    return (
        <div className="glass rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
                <div className="shimmer h-4 w-3/4 rounded-lg" />
                <div className="shimmer h-5 w-16 rounded-full" />
            </div>
            <div className="shimmer h-3 w-24 rounded-md" />
            <div className="flex flex-col gap-1.5">
                <div className="shimmer h-3 w-full rounded-md" />
                <div className="shimmer h-3 w-2/3 rounded-md" />
                <div className="shimmer h-3 w-1/2 rounded-md" />
            </div>
            <div className="shimmer h-3 w-32 rounded-md" />
            <div className="flex gap-2 pt-1">
                <div className="shimmer flex-1 h-8 rounded-xl" />
                <div className="shimmer h-8 w-8 rounded-xl" />
            </div>
        </div>
    )
}
