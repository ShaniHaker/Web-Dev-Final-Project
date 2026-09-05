'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { LayoutDashboard, FileText, Users,  Settings,
    LogOut } from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    const navItems = [
        {
            href: '/admin',
            label: 'סקירה כללית',
            icon: LayoutDashboard
        },
        {
            href: '/admin/content',
            label: 'ניהול תוכן',
            icon: FileText
        },
        {
            href: '/admin/fleet',
            label: 'ניהול משתתפים',
            icon: Users
        },
        {
            href: '/admin/settings',
            label: 'הגדרות',
            icon: Settings
        }
    ];

    function handleLogout() {
        localStorage.removeItem('adminAccessToken');

        localStorage.removeItem('adminRefreshToken');

        router.replace('/admin/login');
    }

    return (
        <div
            dir="rtl"
            className="min-h-screen flex bg-slate-50">
            <aside
                className=" w-64 min-h-screen bg-slate-950
                    text-white border-l border-slate-800
                    flex flex-col">

                <div className="p-6 border-b border-slate-800">
                    <p className="text-xs text-slate-400 mb-1">
                        Defergency
                    </p>

                    <h1 className="text-xl font-bold">
                        ניהול מערכת
                    </h1>
                </div>

                <nav className="p-4 space-y-2">
                {navItems.map(
                    ({href, label, icon: Icon}) => {
                    const active = pathname === href;

                    return (
                    <Link key={href}
                        href={href}
                     className={` flex items-center
                     gap-3 px-4 py-3 rounded-lg transition

                    ${ active
                    ? 'bg-red-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                    <Icon size={19} />

                     <span className="font-medium">
                    {label}
                    </span>
                    </Link>
                            );
                        }
                    )}
                </nav>

            <div className="mt-auto p-4 border-t border-slate-800">
            <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3
             px-4 py-3 rounded-lg text-slate-300
             hover:bg-red-950 hover:text-red-300
             transition">
             <LogOut size={19} />

             <span className="font-medium">
                            התנתקות
                        </span>
                    </button>
                </div>
            </aside>

            <div className="flex-1 min-w-0">
                <header
                    className=" bg-white border-b border-slate-200
                    px-8 py-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500">
                            ממשק מנהל
                        </p>
                    </div>

                    <div
                        className=" text-sm font-medium text-slate-700
                         bg-slate-100 px-4 py-2 rounded-full">
                        מנהל מערכת
                    </div>
                </header>

                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}