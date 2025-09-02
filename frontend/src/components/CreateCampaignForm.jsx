import React, { useState } from 'react';

export default function CreateCampaignForm({ onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onCreate({ name, description, avatar });
    setName('');
    setDescription('');
    setAvatar('');
  }

  return (
    <form className="w-full max-w-xl mx-auto mt-8 p-4 bg-white rounded shadow" onSubmit={handleSubmit}>
      <h2 className="text-lg font-bold mb-4">Create a New Campaign</h2>
      <div className="mb-2">
        <label className="block mb-1 font-medium">Name</label>
        <input
          className="w-full px-3 py-2 border rounded"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>
      <div className="mb-2">
        <label className="block mb-1 font-medium">Description</label>
        <textarea
          className="w-full px-3 py-2 border rounded"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />
      </div>
      <div className="mb-2">
        <label className="block mb-1 font-medium">Avatar URL (optional)</label>
        <input
          className="w-full px-3 py-2 border rounded"
          value={avatar}
          onChange={e => setAvatar(e.target.value)}
        />
      </div>
      <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" type="submit">
        Create Campaign
      </button>
    </form>
  );
}
