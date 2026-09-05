'use client';

import { useEffect, useState } from 'react';

type SystemSettings = {
    candidateRadiusKm: number;
    arrivalThresholdMeters: number;
    lowBatteryThreshold: number;
};

export default function SettingsPage() {
    const [settings, setSettings] = useState<SystemSettings | null>(null);

    const [saving, setSaving] = useState(false);

    const [message, setMessage] =
        useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const response = await fetch('http://localhost:3002/api/settings');

            const data = await response.json();

            if (!response.ok) {
                throw new Error( data.error || 'Failed to load settings');
            }

            setSettings(data);

        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    async function saveSettings() {
        if (!settings) {
            return;
        }

        try {
            setSaving(true);
            setMessage('');

            const token = localStorage.getItem('adminAccessToken');

            const response = await fetch(
                'http://localhost:3002/api/admin/settings',
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':'application/json',

                        Authorization: `Bearer ${token}`
                    },

                    body: JSON.stringify(settings)
                });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save settings');
            }

            setSettings(data.settings);

            setMessage('ההגדרות נשמרו בהצלחה');

        } catch (error) {
            console.error('Failed to save settings:', error);

            setMessage('שמירת ההגדרות נכשלה');

        } finally {
            setSaving(false);
        }
    }

    if (!settings) {
        return <p>טוען הגדרות...</p>;
    }

    return (
        <div
            dir="rtl"
            className="max-w-3xl">
            <h1 className="text-3xl font-bold mb-2">
                הגדרות מערכת
            </h1>

            <p className="text-slate-600 mb-8">
                ניהול פרמטרים תפעוליים של המערכת
            </p>

            <div
                className=" bg-white border rounded-xl p-6
                    space-y-6">
                <SettingField label="רדיוס חיפוש מתנדבים"
                unit="ק״מ" value={ settings.candidateRadiusKm}
                min={1} max={50}
                onChange={(value) => setSettings({
                ...settings, candidateRadiusKm: value})} />

                <SettingField label="מרחק הגעה לאירוע"
                 unit="מטרים" value={ settings.arrivalThresholdMeters}
                min={10} max={500}
                onChange={(value) => setSettings({
                ...settings, arrivalThresholdMeters: value})}
                />

                <SettingField label="סף סוללת LoRa נמוכה"
                unit="%" value={settings.lowBatteryThreshold}
                min={1} max={100} onChange={(value) =>
                setSettings({...settings, lowBatteryThreshold: value
                        })}
                />

                <div className="pt-3">
                    <button onClick={saveSettings}
                    disabled={saving} className=" bg-slate-900
                     text-white px-6 py-3 rounded-lg
                    disabled:opacity-50">
                    { saving
                    ? 'שומר...'
                    : 'שמירת הגדרות'
                    }
                    </button>

                    {message && (
                        <p className="mt-3 text-sm">
                            {message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function SettingField({ label, unit, value, min, max,
    onChange
}: { label: string; unit: string; value: number; min: number;
    max: number; onChange: (value: number) => void;
}) {
    return (
        <div>
            <label className="block font-medium mb-2">
                {label}
            </label>

            <div className="flex items-center gap-3">
                <input
                    type="number" value={value}
                    min={min} max={max} onChange={(e) => onChange(
                    Number(e.target.value))
                    }
                    className="w-40 border rounded-lg
                     px-3 py-2"/>

                <span className="text-slate-500">
                    {unit}
                </span>
            </div>
        </div>
    );
}