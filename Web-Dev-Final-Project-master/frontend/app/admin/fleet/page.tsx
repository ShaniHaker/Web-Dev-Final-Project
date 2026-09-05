'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type FleetMember = {
    id_user: number;
    id_fleet: number;

    first_name: string;
    last_name: string | null;
    phone: string;

    has_defi: number;
    has_lora: number;

    dev_EUI: string | null;
    med_training: string | null;

    lora_battery: number | null;
    is_working_defi: number;

    latitude: number | null;
    longitude: number | null;
    time_of_transmit: string | null;
};

export default function AdminFleetPage() {
    const [fleet, setFleet] = useState<FleetMember[]>([]);

    const [search, setSearch] = useState('');

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const [editingMember, setEditingMember] = useState<FleetMember | null>(null);

    useEffect(() => {
        loadFleet();
    }, []);

    async function loadFleet() {
        try {
            const token = localStorage.getItem('adminAccessToken');

            const response =await fetch( 'http://localhost:3001/api/admin/fleet',
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load fleet');
            }

            setFleet(data);

        } catch (error) {
            console.error(error);

            setError(
                'טעינת המשתתפים נכשלה'
            );

        } finally {
            setLoading(false);
        }
    }

    const filteredFleet =
        useMemo(() => {
            const value =
                search.trim().toLowerCase();

            if (!value) {
                return fleet;
            }

            return fleet.filter(
                (member) => {
                    const fullName =
                        `${member.first_name} ${member.last_name ?? ''}`
                            .toLowerCase();

                    return (
                        fullName.includes(value) ||
                        member.phone.includes(value) ||
                        member.dev_EUI
                            ?.toLowerCase()
                            .includes(value)
                    );
                }
            );
        }, [fleet, search]);

    if (loading) {
        return <p>טוען משתתפים...</p>;
    }

    async function handleDelete(
        userId: number,
        name: string
    ) {
        const confirmed =
            window.confirm(`האם להסיר את ${name} מהמערכת?`);

        if (!confirmed) {
            return;
        }

        const token = localStorage.getItem('adminAccessToken');

        const response = await fetch(
            `http://localhost:3001/api/admin/users/${userId}`,
            {
                method: 'DELETE',
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete user');
        }

        setFleet((current) =>
            current.filter(
                (member) => member.id_user !== userId
            )
        );
    }

    async function handleUpdate() {
    if (!editingMember) {
        return;
    }

    try {
        const token = localStorage.getItem('adminAccessToken');

        const response = await fetch(
        `http://localhost:3001/api/admin/fleet/${editingMember.id_fleet}`,
        {
            method: 'PUT',

            headers: {
                'Content-Type': 'application/json',

                Authorization:`Bearer ${token}`
            },

            body: JSON.stringify({
                first_name: editingMember.first_name,
                last_name: editingMember.last_name,
                phone: editingMember.phone,
                med_training: editingMember.med_training,
                has_defi: editingMember.has_defi,
                has_lora: editingMember.has_lora,
                dev_EUI: editingMember.has_lora
                        ? editingMember.dev_EUI : null,
                lora_battery: editingMember.has_lora
                            ? editingMember.lora_battery : null,
                is_working_defi: editingMember.has_defi
                                ? editingMember.is_working_defi
                                : 0
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update fleet member');
            }

            await loadFleet();

            setEditingMember(null);

        } catch (error) {
            console.error('Failed to update fleet member:', error);

            setError('עדכון המשתתף נכשל');
        }
    }

    return (
        <div dir="rtl">

            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">
                    ניהול משתתפים
                </h1>

                <p className="text-slate-600">
                    צפייה וניהול המשתתפים הרשומים במערכת
                </p>
            </div>

            <div className="mb-5">
                <input
                    type="text"
                    placeholder="חיפוש לפי שם, טלפון או DevEUI..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)
                    }
                    className="w-full max-w-xl border
                        rounded-lg px-4 py-3"/>
            </div>

            {error && (
                <p className="text-red-600 mb-4">
                    {error}
                </p>
            )}

            <div
                className=" bg-white border rounded-xl
                    overflow-x-auto">

                <table className="w-full text-sm">

                    <thead className="bg-slate-100">
                        <tr>
                            <th className="p-4 text-right">
                                שם
                            </th>

                            <th className="p-4 text-right">
                                טלפון
                            </th>

                            <th className="p-4 text-right">
                                הכשרה
                            </th>

                            <th className="p-4 text-right">
                                דפיברילטור
                            </th>

                            <th className="p-4 text-right">
                                LoRa
                            </th>

                            <th className="p-4 text-right">
                                סוללה
                            </th>

                            <th className="p-4 text-right">
                                שידור אחרון
                            </th>

                            <th className="p-4 text-right">
                                פעולה
                            </th>
                        </tr>
                    </thead>

            <tbody>
            {filteredFleet.map((member) => (
                <tr key={member.id_fleet}
                    className="border-t hover:bg-slate-50">

                    <td className="p-4 font-medium">
                        {member.first_name}{' '}
                        {member.last_name}
                        </td>

                    <td className="p-4">
                        {member.phone}
                    </td>

                    <td className="p-4">
                    {member.med_training ?? '-'}
                    </td>

                    <td className="p-4">
                    {member.has_defi
                    ? member.is_working_defi
                    ? 'תקין'
                    : 'לא תקין'
                    : '-'}
                    </td>

                    <td className="p-4">
                    {member.has_lora
                        ? 'כן'
                        : '-'}
                    </td>

                    <td className="p-4">
                    {!member.has_lora ? ''
                                    : member.lora_battery != null 
                                    ? `${member.lora_battery}%`
                                    : '-'}
                    </td>

                    <td className="p-4">
                    {member.time_of_transmit
                    ? new Date(member.time_of_transmit).toLocaleString('he-IL')
                    : 'טרם שודר'}
                    </td>

                    <td className="p-4">
                        <div className="flex gap-3">

                    <button onClick={() => setEditingMember({...member})}
                                title="עריכה">
                            <Pencil size={20} color="#475569" />
                    </button>

                    <button onClick={() => handleDelete(member.id_user, `${member.first_name} ${member.last_name ?? ''}`)}
                                                title="הסרה">
                        <Trash2 size={20} color="#dc2626"/>
                                            </button>

                                        </div>
                                    </td>

                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>


        {editingMember && (

        <div className=" fixed inset-0 bg-black/40
            flex items-center justify-center z-50">

        <div className=" bg-white rounded-xl p-7 w-full max-w-xl max-h-[90vh]
        overflow-y-auto">

        <h2 className="text-2xl font-bold mb-6">
             עריכת משתתף
        </h2>

        <div className="space-y-4">

             <div>
            <label className="block mb-1">
             שם פרטי
            </label>

             <input value={editingMember.first_name}
                onChange={(e) => setEditingMember({...editingMember,
                                first_name:e.target.value})}
                className="w-full border rounded-lg p-2"/>
            </div>


            <div>
                <label className="block mb-1">
                 שם משפחה
                 </label>

                 <input value={editingMember.last_name ?? ''}
                 onChange={(e) => setEditingMember({
                    ...editingMember, last_name: e.target.value})}
                className=" w-full border rounded-lg p-2"/>
            </div>

             <div>
             <label className="block mb-1">
              טלפון
             </label>

             <input value={editingMember.phone}
                onChange={(e) => setEditingMember({...editingMember,
                    phone: e.target.value})}
                className="w-full border rounded-lg p-2"/>
            </div>

            <div>
            <label className="block mb-1">
             הכשרה רפואית
            </label>

             <select value={ editingMember.med_training ?? ''}
                onChange={(e) => setEditingMember({...editingMember,
                    med_training:e.target.value})}
                className=" w-full border rounded-lg p-2 bg-white">
                    <option value="">
                     ללא הכשרה
                      </option>

                 <option value="First Aid">
                     עזרה ראשונה
                 </option>

                 <option value="Medic">
                     חובש/ת
                 </option>

                 <option value="Paramedic">
                      פרמדיק/ית
                 </option>

                 <option value="Doctor">
                     רופא/ה
                </option>
                 </select>
            </div>

             <label className="flex items-center gap-2">
             <input type="checkbox"
                     checked={ Boolean(editingMember.has_defi) }
                     onChange={(e) => setEditingMember({...editingMember,
                    has_defi: e.target.checked ? 1 : 0,
                     is_working_defi: e.target.checked
                                    ? editingMember.is_working_defi : 0})}/>
                                דפיברילטור
                            </label>

                {Boolean(editingMember.has_defi) && (

                <label className="flex items-center gap-2">

                <input type="checkbox" checked={
                     Boolean( editingMember.is_working_defi )}
                     onChange={(e) => setEditingMember({...editingMember,
                     is_working_defi: e.target.checked ? 1 : 0})}
                    />
                      דפיברילטור תקין

                 </label>
                )}

                <label className="flex items-center gap-2">
                     <input type="checkbox" checked={
                        Boolean(editingMember.has_lora)}
                        onChange={(e) => setEditingMember({ ...editingMember,
                                has_lora: e.target.checked ? 1 : 0,
                                dev_EUI: e.target.checked
                                         ? editingMember.dev_EUI
                                        : null,

                                 lora_battery: e.target.checked
                                             ? editingMember.lora_battery
                                             : null })} />

                                מכשיר LoRa
                            </label>

                    {Boolean(editingMember.has_lora) && (
                        <>
                        <div>
                     <label className="block mb-1">
                          DevEUI
                     </label>

                      <input value={ editingMember.dev_EUI ?? '' }
                            onChange={(e) => setEditingMember({
                            ...editingMember,
                             dev_EUI: e.target.value}) }
                        className=" w-full border rounded-lg p-2"/>
                        </div>
                         <div>
                         <label className="block mb-1">
                             סוללת LoRa
                         </label>

                         <input type="number" min="0"
                             max="100" value={
                             editingMember.lora_battery ?? ''}
                             onChange={(e) => setEditingMember({
                            ...editingMember,
                             lora_battery: e.target.value === ''
                                ? null : Number(e.target.value)})}
                             className=" w-full border rounded-lg p-2"/>
                            </div>
                                </>
                            )}

                        </div>

                     <div className="flex gap-3 mt-7">

                         <button onClick={handleUpdate}
                         className=" bg-slate-900 text-white
                         px-5 py-2 rounded-lg">
                                שמירה
                         </button>

                         <button onClick={() => setEditingMember(null)}
                         className="border px-5 py-2 rounded-lg">
                                ביטול
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}