import type { SingleInfo, Thumbnail } from '@/system/types';

import { AlertTriangle, Download, Info } from 'lucide-react';
import { useState } from 'react';

import { useShallow } from 'zustand/shallow';
import ActionButton from '@/app/components/ActionButton';
import CustomSelect from '@/app/components/CustomSelect';
import MessageScreen from '@/app/components/MessageScreen';
import { useVideoStore } from '@/app/popup/video-store';

function ThumbnailsSinglePicker({
    info,
    downloadThumbnail,
}: {
    info: SingleInfo;
    downloadThumbnail: (thumbnail: Thumbnail) => Promise<void>;
}) {
    const { thumbnails, thumbnailUrl } = info;

    const options = thumbnails!.map((thumbnail) => {
        return {
            value: `${thumbnail.width}x${thumbnail.height}`,
            label: `${thumbnail.label} (${thumbnail.width}x${thumbnail.height})`,
        };
    });

    const defaultValue = options.at(-1)!.value;
    const [selectedQuality, setSelectedQuality]
        = useState<string>(defaultValue);
    const [downloading, setDownloading] = useState(false);

    return (
        <>
            <div className="border-promo-border bg-background-promo relative mb-5 aspect-video overflow-hidden rounded-xl border-2">
                <img
                    alt="Video thumbnail preview showing Costa Rica nature scene"
                    className="aspect-video object-cover"
                    src={thumbnailUrl}
                />
            </div>

            <div className="mb-4">
                <CustomSelect
                    heading="Select Quality"
                    options={options}
                    value={selectedQuality}
                    onChange={setSelectedQuality}
                    position="top"
                />
            </div>

            <ActionButton
                text="Download"
                Icon={Download}
                loading={downloading}
                onClick={async () => {
                    setDownloading(true);

                    const thumbnail = thumbnails!.find((thumbnail) => {
                        return (
                            `${thumbnail.width}x${thumbnail.height}`
                            === selectedQuality
                        );
                    });

                    downloadThumbnail(thumbnail!);

                    setDownloading(false);
                }}
            />
        </>
    );
}

export default function YouTubeThumbnailsDownload() {
    const [info, downloadThumbnail] = useVideoStore(
        useShallow(state => [state.info, state.downloadThumbnail]),
    );

    if (!info)
        return null;

    if (info.type === 'list') {
        return (
            <MessageScreen
                icon={Info}
                message="Thumbnails are available when a single video is open, not on the feed or Reels tab list."
            />
        );
    }

    if (!info.thumbnails || info.thumbnails.length === 0) {
        return (
            <MessageScreen
                icon={AlertTriangle}
                message="No thumbnails available."
            />
        );
    }

    return (
        <ThumbnailsSinglePicker
            info={info}
            downloadThumbnail={downloadThumbnail}
        />
    );
}
