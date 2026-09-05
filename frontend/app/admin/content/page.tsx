'use client';

import { useEffect, useState } from 'react';

type HomeContent = {
    hero: {
        title: string;
        subtitle: string;
    };

    lora: {
        title: string;
        description: string;
    };

    registration: {
        title: string;
        description: string;
    };
};

const emptyContent: HomeContent = {
    hero: {
        title: 'דפיברילטור קרוב יכול להציל חיים',
        subtitle: ''
    },

    lora: {
        title: '',
        description: ''
    },

    registration: {
        title: '',
        description: ''
    }
};

export default function ContentPage() {
    const [content, setContent] = useState<HomeContent>(emptyContent);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [message, setMessage] = useState('');

    const [error, setError] = useState('');

    useEffect(() => {
        loadContent();
    }, []);

    async function loadContent() {
        try {
            setError('');

            const response = await fetch(
                'http://localhost:3002/api/content/home'
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    'Failed to load content'
                );
            }

            setContent({
                hero: {
                    title:
                        data.hero?.title || '',

                    subtitle:
                        data.hero?.subtitle || ''
                },

                lora: {
                    title:
                        data.lora?.title || '',

                    description:
                        data.lora?.description || ''
                },

                registration: {
                    title:
                        data.registration?.title || '',

                    description:
                        data.registration?.description || ''
                }
            });

        } catch (error) {
            console.error(
                'Content loading failed:',
                error
            );

            setError(
                'טעינת תוכן האתר נכשלה'
            );

        } finally {
            setLoading(false);
        }
    }

    async function saveContent() {
        try {
            setSaving(true);
            setMessage('');
            setError('');

            const accessToken =
                localStorage.getItem(
                    'adminAccessToken'
                );

            const response = await fetch(
                'http://localhost:3002/api/admin/content/home',
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${accessToken}`
                    },

                    body:
                        JSON.stringify(content)
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    'Failed to save content'
                );
            }

            setMessage(
                'התוכן נשמר בהצלחה'
            );

        } catch (error) {
            console.error(
                'Content saving failed:',
                error
            );

            setError(
                'שמירת התוכן נכשלה'
            );

        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <p dir="rtl">
                טוען תוכן...
            </p>
        );
    }

    return (
        <div
            dir="rtl"
            className="max-w-4xl"
        >
            <h1 className="text-3xl font-bold mb-2">
                ניהול תוכן
            </h1>

            <p className="text-slate-600 mb-8">
                עריכת התוכן המוצג בעמוד הבית
            </p>

            <div className="space-y-6">

                <Section title="אזור ראשי">
                    <Field
                        label="כותרת ראשית"
                        value={
                            content.hero.title
                        }
                        onChange={(value) =>
                            setContent({
                                ...content,

                                hero: {
                                    ...content.hero,
                                    title: value
                                }
                            })
                        }
                    />

                    <TextAreaField
                        label="תיאור ראשי"
                        value={
                            content.hero.subtitle
                        }
                        onChange={(value) =>
                            setContent({
                                ...content,

                                hero: {
                                    ...content.hero,
                                    subtitle: value
                                }
                            })
                        }
                    />
                </Section>


                <Section title="אזור LoRa">
                    <Field
                        label="כותרת"
                        value={
                            content.lora.title
                        }
                        onChange={(value) =>
                            setContent({
                                ...content,

                                lora: {
                                    ...content.lora,
                                    title: value
                                }
                            })
                        }
                    />

                    <TextAreaField
                        label="תיאור"
                        value={
                            content.lora.description
                        }
                        onChange={(value) =>
                            setContent({
                                ...content,

                                lora: {
                                    ...content.lora,
                                    description: value
                                }
                            })
                        }
                    />
                </Section>


                <Section title="אזור הרשמה">
                    <Field
                        label="כותרת"
                        value={
                            content.registration.title
                        }
                        onChange={(value) =>
                            setContent({
                                ...content,

                                registration: {
                                    ...content.registration,
                                    title: value
                                }
                            })
                        }
                    />

                    <TextAreaField
                        label="תיאור"
                        value={
                            content.registration.description
                        }
                        onChange={(value) =>
                            setContent({
                                ...content,

                                registration: {
                                    ...content.registration,
                                    description: value
                                }
                            })
                        }
                    />
                </Section>

            </div>

            <div className="mt-6 flex items-center gap-4">
                <button
                    onClick={saveContent}
                    disabled={saving}
                    className="
                        bg-slate-900
                        text-white
                        px-6
                        py-3
                        rounded-lg
                        disabled:opacity-50
                    "
                >
                    {
                        saving
                            ? 'שומר...'
                            : 'שמירת שינויים'
                    }
                </button>

                {message && (
                    <span className="text-green-700">
                        {message}
                    </span>
                )}

                {error && (
                    <span className="text-red-600">
                        {error}
                    </span>
                )}
            </div>
        </div>
    );
}


function Section({
    title,
    children
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section
            className=" bg-white border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-5">
                {title}
            </h2>

            <div className="space-y-4">
                {children}
            </div>
        </section>
    );
}


function Field({
    label,
    value,
    onChange
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <label className="block mb-2 font-medium">
                {label}
            </label>

            <input
                type="text"
                value={value}
                onChange={(e) =>
                    onChange(
                        e.target.value
                    )
                }
                className=" w-full border rounded-lg p-3"
            />
        </div>
    );
}


function TextAreaField({
    label,
    value,
    onChange
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div>
            <label className="block mb-2 font-medium">
                {label}
            </label>

            <textarea
                value={value}
                onChange={(e) =>
                    onChange(
                        e.target.value
                    )
                }
                className=" w-full border rounded-lg p-3 min-h-28"
            />
        </div>
    );
}