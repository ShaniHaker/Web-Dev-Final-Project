'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldLock } from 'lucide-react';

export default function AdminLoginPage() {
    const router = useRouter();

    const [username, setUsername ] = useState('');
    const [password, setPassword ] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            const response = await fetch(`
                http://localhost:3002/api/auth/login`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username, password
                })
            });

            const data = await response.json();

            if(!response.ok) {
                throw new Error(data.error || 'Admin Login Failed');
            }

            localStorage.setItem('adminAccessToken', data.accessToken);

            localStorage.setItem('adminRefreshToken', data.refreshToken);

            router.push('/admin');
        }
         catch(error) {

            console.error('Admin login failed', error);
            setError(error instanceof Error ? error.message : `אירעה שגיאה בכניה`);

         }
         finally {
            setLoading(false);
         }
    }

    return(

        <main dir="rtl" className="min-h-screen bg-slate-100
        flex items-center justify-center">

            <div className="w-full max-w-md">

                <div className="text-center mb-8">

                    <div className="flex justify-center mb-4">

                        <ShieldLock size={70} className="text-slate-950"/>

                    </div>

                    <h1 className="text-3xl font-bold mb-2">
                        כניסת מנהל מערכת
                    </h1>

                    <p className="text-slate-600">
                        הכניסה מיועדת למנהלי מערכת בלבד
                    </p>

                </div>

                <form onSubmit={handleLogin} className="bg-white border border-slate-200 rounded-2xl 
                shadow-sm p-8 space-y-5">
                    
                    <div>
                        <label className="block fond-medium mb-1"> שם משתמש</label>
                        <input required type="text" value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"/>

                    </div>

                    <div>
                        <label className="block font-medium mb-1"> סיסמה </label>
                        <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"/>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700
                        rounded-lg px-3 py-2">
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading} 
                    className="w-full bg-slate-950 hover:bg-slate-800
                    disabled:bg-slate-500 text-white rounded-lg py-3 font-bold">
                        {loading ? 'מתחבר...' : 'כניסה'}
                    </button>
                </form>

                <Link href="/login" className="text-slate-500 hover:text-slate-800">
                    חזרה
                </Link>

            </div>

        </main>


    );

}