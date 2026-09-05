'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';

type AdminStats = {
    totalFleet: number;
    activeDefibrillators: number;
    loraDevices: number;
    activeEmergencies: number;
}

export default function AdminPage() {

    const [stats, setStats] = useState<AdminStats | null>(null);

    useEffect (() => {
        async function loadStats() {
            const token = localStorage.getItem('adminAccessToken');

            const response = await fetch(
                'http://localhost:3001/api/admin/stats', 
                {
                    headers:
                    {
                        Authorization:`Bearer ${token}`
                    }
                }
            );

            if(!response.ok) {
                console.error('Failed to load admin stats');
                return;
            }

              console.log(
                    'response status:',
                    response.status
                );

            const data = await response.json();
            setStats(data);
        }
        loadStats();
    }, []);

    return (
        <div dir="rtl">
            <h1 className="text-3xl font-bold mb-2">
                לוח ניהול
            </h1>

            <p className="text-slate-600 mb-8">
                ניהול המערכת, המשתתפים ותוכן האתר
            </p>

            <div className="grid md:grid-cols-4 gap-4 mb-10 text-center">
                <StatCard
                    title="סה״כ משתתפים"
                    value={stats ? stats.totalFleet.toString() : '--'}
                />

                <StatCard
                    title="דפיברילטורים פעילים"
                    value={stats ? stats.activeDefibrillators.toString() : '--'}
                />

                <StatCard
                    title="מכשירי LoRa פעילים"
                    value={stats ? stats.loraDevices.toString() : "--"}
                />

                <StatCard
                    title="אירועים פעילים"
                    value={stats ? stats.activeEmergencies.toString() : "--"}
                />
            </div>

            <div className="grid md:grid-cols-3 gap-5">
                <QuickLink
                    href="/admin/content"
                    title="ניהול תוכן"
                    description="עריכת תוכן עמוד הבית והמידע באתר"
                />

                <QuickLink
                    href="/admin/fleet"
                    title="ניהול משתתפים"
                    description="צפייה, חיפוש והסרת משתתפים"
                />

                <QuickLink
                    href="/admin/settings"
                    title="הגדרות"
                    description="הגדרות מערכת ורדיוסים"
                />
            </div>
        </div>
    );
}

function StatCard({
    title,
    value
}: {
    title: string;
    value: string;
}) {
    return (
        <div className="bg-white border rounded-xl p-5">
            <p className="text-sm text-slate-500">
                {title}
            </p>

            <p className="text-3xl font-bold mt-2">
                {value}
            </p>
        </div>
    );
}

function QuickLink({
    href,
    title,
    description
}: {
    href: string;
    title: string;
    description: string;
}) {
    return (
        <Link
            href={href}
            className=" bg-white border rounded-xl
                p-6 hover:shadow-md transition">
            <h2 className="text-xl font-bold mb-2">
                {title}
            </h2>

            <p className="text-slate-600">
                {description}
            </p>
        </Link>
    );
}