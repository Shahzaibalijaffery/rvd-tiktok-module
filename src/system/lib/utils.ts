import type { ClassValue } from 'clsx';
import axios from 'axios';

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...v: ClassValue[]) {
    return twMerge(clsx(v));
}

export function isPromise(value: any): value is Promise<unknown> {
    return value && typeof value.then === 'function';
}

export function formatTime(time: number) {
    const hours = Math.floor(time / 3600)
        .toString()
        .padStart(2, '0');

    const minutes = Math.floor((time % 3600) / 60)
        .toString()
        .padStart(2, '0');

    const seconds = (time % 60).toString().padStart(2, '0');

    return hours === '00' ? `${minutes}:${seconds}` : `${hours}:${minutes}:${seconds}`;
}

export function parseTime(timeStr: string) {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return (hours ?? 0) * 3600 + (minutes ?? 0) * 60 + (seconds ?? 0);
}

export async function getFileSize(url: string): Promise<number | null> {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url.trim()))
        return null;

    const response = await axios.head(url.trim(), { withCredentials: false });

    return typeof response.headers['content-length'] !== 'undefined'
        ? Number.parseInt(response.headers['content-length'], 10)
        : null;
};

export async function readFile(file: File) {
    return new Promise<string>((resolve) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(file);
    });
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
