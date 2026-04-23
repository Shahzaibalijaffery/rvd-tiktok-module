import type { FC, SVGProps } from 'react';

interface Props {
    message: string;
    icon: FC<SVGProps<SVGSVGElement>>;
}

export default function MessageScreen({ message, icon: Icon }: Props) {
    return (
        <div className="flex flex-col items-center justify-center px-4 py-16">
            <Icon className="mb-3 h-12 w-12" />
            <p className="text-text-secondary text-center">{message}</p>
        </div>
    );
}
