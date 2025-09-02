import React, { useState } from 'react';

export default function CampaignEditModal({ campaign, open, onClose, onSave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  React.useEffect(() => {
    setName(campaign?.name || '');
    setDescription(campaign?.description || '');
  }, [campaign]);

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ ...campaign, name, description });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Campaign</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col">
            <span className="font-semibold mb-1">Name</span>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="border rounded px-2 py-1"
              required
            />
          </label>
          <label className="flex flex-col">
            <span className="font-semibold mb-1">Description</span>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="border rounded px-2 py-1"
              rows={3}
            />
          </label>
          <div className="flex gap-2 justify-end mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
