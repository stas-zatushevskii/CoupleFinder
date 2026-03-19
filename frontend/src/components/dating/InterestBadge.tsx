type Props = {
    value: string;
};

export function InterestBadge({ value }: Props) {
    return (
        <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-medium text-pink-700">
      {value}
    </span>
    );
}