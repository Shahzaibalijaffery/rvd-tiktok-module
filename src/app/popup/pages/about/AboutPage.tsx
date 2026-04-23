import { Calendar, Download, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

import { userData } from '@/core/common/globals';
import AboutFeatures from './AboutFeatures';
import AboutHeader from './AboutHeader';
import { AboutLinks } from './AboutLinks';
import { StatsCard } from './StatsCard';

export default function AboutPage() {
    const [activeDaysCount, setActiveDaysCount] = useState(0);
    const downloadsCount = userData.downloadsCount;

    useEffect(() => {
        const installedAt = userData.installedAt ?? Date.now();
        const days = Math.floor((Date.now() - installedAt) / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
        setActiveDaysCount(days);

        if (!userData.installedAt) {
            userData.set('installedAt', Date.now());
        }
    }, []);

    return (
        <div className="max-h-[456px] space-y-5 overflow-y-auto p-5">
            <AboutHeader />

            { /* Stats Section */ }
            <div className="grid grid-cols-3 gap-3">
                <StatsCard
                    icon={Calendar}
                    value={activeDaysCount}
                    label="Days Active"
                    iconColor="text-blue-500"
                    bgColor="bg-blue-50 dark:bg-blue-500/20"
                />
                <StatsCard
                    icon={Download}
                    value={downloadsCount}
                    label="Downloads"
                    iconColor="text-green-500"
                    bgColor="bg-green-50 dark:bg-green-500/20"
                />
                <StatsCard
                    icon={Sparkles}
                    value="1000+"
                    label="Websites"
                    iconColor="text-purple-500"
                    bgColor="bg-purple-50 dark:bg-purple-500/20"
                />
            </div>

            <AboutFeatures />
            <AboutLinks />

            <div className="pt-2 text-center">
                <p className="text-text-secondary text-[10px]">
                    © 2025 Addoncrop. All rights reserved.
                </p>
            </div>
        </div>
    );
}
