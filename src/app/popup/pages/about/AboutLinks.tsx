import { ChevronDown, ExternalLink, FileText, Globe, Mail, Shield } from 'lucide-react';
import { useState } from 'react';
import { __t } from '@/system/lib/i18n';
import { cn } from '@/system/lib/utils';

export function AboutLinks() {
    const [openList, setOpenList] = useState(false);

    const links = [
        {
            icon: Globe,
            label: __t('popup_link_home', 'Visit Website'),
            url: 'https://addoncrop.com',
        },
        {
            icon: Shield,
            label: __t('popup_link_privacy', 'Privacy Policy'),
            url: 'https://addoncrop.com/privacy',
        },
        {
            icon: FileText,
            label: __t('popup_link_terms', 'Terms of Service'),
            url: 'https://addoncrop.com/terms',
        },
        {
            icon: Mail,
            label: __t('popup_link_support', 'Contact Support'),
            url: 'mailto:support@addoncrop.com',
        },
    ];

    return (
        <div className="bg-tab-bg overflow-hidden rounded-xl border">
            <button
                onClick={() => setOpenList(!openList)}
                className="hover:bg-tab-hover flex w-full cursor-pointer items-center justify-between p-3 transition-colors focus:outline-none"
            >
                <span className="text-sm font-semibold">Quick Links</span>
                <ChevronDown
                    className={cn(
                        'w-4 h-4 transition-transform duration-200 text-text-secondary',
                        openList && 'rotate-180',
                    )}
                />
            </button>

            {openList && (
                <div className="border-promo-border border-t">
                    {links.map((link, index) => (
                        <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            className={cn(
                                'flex items-center gap-3 p-3 transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-inset  hover:bg-tab-hover',
                                index !== links.length - 1 && 'border-b ',
                            )}
                        >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-[#3f3f3f]">
                                <link.icon className="text-primary h-4 w-4" />
                            </div>
                            <span className="text-text-primary flex-1 text-sm dark:text-gray-300">
                                {link.label}
                            </span>
                            <ExternalLink className="text-text-secondary h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
